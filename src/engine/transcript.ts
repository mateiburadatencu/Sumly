import { YoutubeTranscript } from 'youtube-transcript';
import { createHash } from 'crypto';
import OpenAI from 'openai';

const MAX_CHUNK_TOKENS = 12000;
const APPROX_CHARS_PER_TOKEN = 4;
const MAX_CHUNK_CHARS = MAX_CHUNK_TOKENS * APPROX_CHARS_PER_TOKEN;
const WHISPER_MAX_BYTES = 24 * 1024 * 1024;

const INNERTUBE_CONTEXTS = [
  // Android client — works for most videos
  { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } },
  // TV embedded player — bypasses LOGIN_REQUIRED and age restrictions
  {
    client: { clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER', clientVersion: '2.0' },
    thirdParty: { embedUrl: 'https://www.youtube.com' },
  },
  // iOS client — additional fallback
  { client: { clientName: 'IOS', clientVersion: '19.29.1' } },
];

export interface TranscriptResult {
  text: string;
  hash: string;
  chunks: string[];
  durationSeconds: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlayerData = Record<string, any>;

/**
 * Fetch YouTube player data ONCE via InnerTube Android API.
 * Shared by all strategies to avoid rate-limiting from multiple requests.
 */
async function fetchPlayerData(videoId: string): Promise<{ playerData: PlayerData; duration: number } | null> {
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!pageRes.ok) return null;
    const html = await pageRes.text();

    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/);
    if (!apiKeyMatch) return null;

    const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
    const pageDuration = durationMatch ? parseInt(durationMatch[1], 10) : 0;

    // Try each InnerTube client context until one returns OK playability
    for (const context of INNERTUBE_CONTEXTS) {
      const playerRes = await fetch(
        `https://www.youtube.com/youtubei/v1/player?key=${apiKeyMatch[1]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context, videoId }),
        }
      );
      if (!playerRes.ok) continue;

      const playerData = await playerRes.json();
      const status = playerData.playabilityStatus?.status;
      const duration = playerData.videoDetails?.lengthSeconds
        ? parseInt(playerData.videoDetails.lengthSeconds, 10)
        : pageDuration;

      console.log(`[Transcript] Client ${context.client.clientName}: playability=${status}, duration=${duration}s`);

      if (status === 'OK') return { playerData, duration };
    }

    console.log('[Transcript] All client contexts failed to get OK playability');
    return null;
  } catch (e) {
    console.log(`[Transcript] fetchPlayerData failed: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

/**
 * Main entry point. Fetches player data once, then tries:
 * 1. Captions from player data (fastest)
 * 2. youtube-transcript package (fallback)
 * 3. Audio download + Whisper (works even when captions are disabled)
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptResult> {
  const errors: string[] = [];

  // Single player data fetch — reused by strategies 1 and 3
  const playerResult = await fetchPlayerData(videoId);
  const playerData = playerResult?.playerData ?? null;
  const duration = playerResult?.duration ?? 0;
  const playerOk = playerData?.playabilityStatus?.status === 'OK';

  // Strategy 1: Captions from player data
  if (playerOk) {
    try {
      console.log(`[Transcript] Strategy 1: captions for ${videoId}`);
      const result = await extractCaptionsFromPlayerData(playerData, duration);
      if (result) { console.log('[Transcript] Strategy 1 succeeded'); return result; }
      errors.push('android-innertube: no captions found');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'failed';
      console.log(`[Transcript] Strategy 1 failed: ${msg}`);
      errors.push(`android-innertube: ${msg}`);
    }
  } else {
    errors.push(`android-innertube: playability=${playerData?.playabilityStatus?.status ?? 'no-data'}`);
  }

  // Strategy 2: youtube-transcript npm package
  try {
    console.log(`[Transcript] Strategy 2: youtube-transcript for ${videoId}`);
    const result = await strategy2_youtubeTranscript(videoId);
    if (result) { console.log('[Transcript] Strategy 2 succeeded'); return result; }
    errors.push('youtube-transcript: no segments found');
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'failed';
    console.log(`[Transcript] Strategy 2 failed: ${msg}`);
    errors.push(`youtube-transcript: ${msg}`);
  }

  // Strategy 3: Audio stream + Whisper (works even without captions)
  if (playerOk) {
    try {
      console.log(`[Transcript] Strategy 3: whisper for ${videoId}`);
      const result = await strategy3_whisperFromPlayerData(playerData, duration);
      console.log('[Transcript] Strategy 3 succeeded');
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'failed';
      console.log(`[Transcript] Strategy 3 failed: ${msg}`);
      errors.push(`whisper: ${msg}`);
    }
  } else {
    errors.push('whisper: skipped (no valid player data)');
  }

  console.error('All transcript strategies failed:', JSON.stringify(errors));
  throw new TranscriptError(
    `Could not get a transcript for this video. Details: ${errors.join(' | ')}`
  );
}

// ─── Strategy 1: Captions from player data ─────────────────────────

async function extractCaptionsFromPlayerData(playerData: PlayerData, duration: number): Promise<TranscriptResult | null> {
  const captionTracks = playerData.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!captionTracks || captionTracks.length === 0) return null;

  console.log(`[Transcript] S1: found ${captionTracks.length} caption track(s)`);

  // Prefer manual English, then auto-generated English, then any track
  const track =
    captionTracks.find((t: { languageCode: string; kind?: string }) => t.languageCode === 'en' && t.kind !== 'asr') ||
    captionTracks.find((t: { languageCode: string }) => t.languageCode === 'en') ||
    captionTracks.find((t: { kind?: string }) => t.kind !== 'asr') ||
    captionTracks[0];

  const baseUrl: string = track?.baseUrl;
  if (!baseUrl) return null;

  const text = await fetchCaptionText(baseUrl);
  if (!text) return null;

  return buildResult(text, duration);
}

async function fetchCaptionText(baseUrl: string): Promise<string | null> {
  const cleanUrl = baseUrl.replace('&fmt=srv3', '');
  const res = await fetch(cleanUrl);
  if (!res.ok) {
    console.log(`[Transcript] fetchCaptionText: HTTP ${res.status}`);
    return null;
  }

  const body = await res.text();
  if (!body || body.length === 0) return null;

  // Format 1: <transcript><text start="..." dur="...">...</text></transcript>
  const textMatches = body.match(/<text[^>]*>([^<]*(?:<[^/][^>]*>[^<]*)*)<\/text>/g);
  if (textMatches && textMatches.length > 0) {
    const texts = textMatches.map(m => decodeXmlEntities(m.replace(/<[^>]+>/g, '')).trim()).filter(Boolean);
    if (texts.length > 0) { console.log(`[Transcript] S1: parsed ${texts.length} text elements`); return cleanSegmentTexts(texts); }
  }

  // Format 2: <p t="..." d="...">...</p>
  const pMatches = body.match(/<p [^>]*>([\s\S]*?)<\/p>/g);
  if (pMatches && pMatches.length > 0) {
    const texts = pMatches.map(m => decodeXmlEntities(m.replace(/<[^>]+>/g, '')).trim()).filter(Boolean);
    if (texts.length > 0) { console.log(`[Transcript] S1: parsed ${texts.length} p elements`); return cleanSegmentTexts(texts); }
  }

  return null;
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec)));
}

// ─── Strategy 2: youtube-transcript npm package ────────────────────

async function strategy2_youtubeTranscript(videoId: string): Promise<TranscriptResult | null> {
  const segments = await YoutubeTranscript.fetchTranscript(videoId);
  if (!segments || segments.length === 0) return null;

  const text = cleanSegmentTexts(segments.map(s => s.text));
  if (!text) return null;

  const lastSeg = segments[segments.length - 1];
  const duration = Math.ceil((lastSeg.offset + lastSeg.duration) / 1000);
  return buildResult(text, duration);
}

// ─── Strategy 3: Audio stream + Whisper ───────────────────────────
// Reuses already-fetched player data — no extra YouTube requests.

async function strategy3_whisperFromPlayerData(playerData: PlayerData, duration: number): Promise<TranscriptResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new TranscriptError('OpenAI API key required for audio transcription.');

  const formats: Array<{ itag: number; mimeType?: string; url?: string; signatureCipher?: string }> =
    playerData.streamingData?.adaptiveFormats ?? [];

  console.log(`[Transcript] S3: ${formats.length} formats, itags: ${formats.map(f => `${f.itag}(url:${!!f.url})`).join(',')}`);

  // Android client returns plain (non-ciphered) stream URLs
  const audioFormat =
    formats.find(f => f.itag === 140 && f.url) ||   // m4a 128kbps
    formats.find(f => f.itag === 251 && f.url) ||   // webm/opus
    formats.find(f => f.mimeType?.startsWith('audio/') && f.url);

  if (!audioFormat?.url) {
    const cipherCount = formats.filter(f => f.signatureCipher && !f.url).length;
    throw new TranscriptError(`No plain audio stream (${formats.length} formats, ${cipherCount} cipher-only)`);
  }

  console.log(`[Transcript] S3: downloading itag ${audioFormat.itag} (${audioFormat.mimeType})`);

  const audioRes = await fetch(audioFormat.url, {
    headers: { Range: `bytes=0-${WHISPER_MAX_BYTES - 1}` },
  });
  console.log(`[Transcript] S3: HTTP ${audioRes.status}, size: ${audioRes.headers.get('content-length')}`);

  if (!audioRes.ok && audioRes.status !== 206) {
    throw new TranscriptError(`Audio download returned HTTP ${audioRes.status}`);
  }

  const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
  if (audioBuffer.length === 0) throw new TranscriptError('Downloaded audio is empty.');

  console.log(`[Transcript] S3: ${audioBuffer.length} bytes downloaded, transcribing with Whisper`);

  const mimeType = audioFormat.mimeType?.split(';')[0] ?? 'audio/mp4';
  const ext = mimeType.includes('webm') ? 'webm' : 'm4a';
  const text = await whisperTranscribe(apiKey, audioBuffer, ext, mimeType);
  return buildResult(text, duration);
}

async function whisperTranscribe(apiKey: string, buffer: Buffer, ext = 'm4a', mimeType = 'audio/mp4'): Promise<string> {
  const openai = new OpenAI({ apiKey });
  const file = new File([new Uint8Array(buffer)], `audio.${ext}`, { type: mimeType });

  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    response_format: 'text',
  });

  const text = typeof response === 'string' ? response : String(response);
  if (!text?.trim()) throw new TranscriptError('Whisper returned empty transcript.');
  return text.trim();
}

// ─── Shared Utilities ──────────────────────────────────────────────

function cleanSegmentTexts(texts: string[]): string {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const raw of texts) {
    const cleaned = raw.replace(/\[.*?\]/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleaned && !seen.has(cleaned)) { seen.add(cleaned); lines.push(cleaned); }
  }
  return lines.join(' ').replace(/\s+/g, ' ').trim();
}

function buildResult(text: string, durationSeconds: number): TranscriptResult {
  const hash = createHash('sha256').update(text).digest('hex');
  const chunks = chunkTranscript(text);
  return { text, hash, chunks, durationSeconds };
}

export function chunkTranscript(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) return [text];

  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > MAX_CHUNK_CHARS) {
      if (current) { chunks.push(current.trim()); current = ''; }
      if (sentence.length > MAX_CHUNK_CHARS) {
        const words = sentence.split(' ');
        let wc = '';
        for (const w of words) {
          if ((wc + ' ' + w).length > MAX_CHUNK_CHARS) { chunks.push(wc.trim()); wc = w; }
          else wc += ' ' + w;
        }
        if (wc) current = wc;
      } else { current = sentence; }
    } else { current += sentence; }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export class TranscriptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranscriptError';
  }
}
