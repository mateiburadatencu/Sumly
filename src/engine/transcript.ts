import { YoutubeTranscript } from 'youtube-transcript';
import { createHash } from 'crypto';
import OpenAI from 'openai';

const MAX_CHUNK_TOKENS = 12000;
const APPROX_CHARS_PER_TOKEN = 4;
const MAX_CHUNK_CHARS = MAX_CHUNK_TOKENS * APPROX_CHARS_PER_TOKEN;
const WHISPER_MAX_BYTES = 24 * 1024 * 1024;

export interface TranscriptResult {
  text: string;
  hash: string;
  chunks: string[];
  durationSeconds: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlayerData = Record<string, any>;

/**
 * Fetch YouTube player data via InnerTube Android API.
 * Returns null if the video is inaccessible or blocked.
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

    const playerRes = await fetch(
      `https://www.youtube.com/youtubei/v1/player?key=${apiKeyMatch[1]}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          context: {
            client: {
              clientName: 'ANDROID',
              clientVersion: '20.10.38',
              androidSdkVersion: 30,
              userAgent: 'com.google.android.youtube/20.10.38 (Linux; U; Android 10) gzip',
            },
          },
        }),
      }
    );
    if (!playerRes.ok) return null;

    const playerData = await playerRes.json();
    const status = playerData.playabilityStatus?.status;
    const duration = playerData.videoDetails?.lengthSeconds
      ? parseInt(playerData.videoDetails.lengthSeconds, 10)
      : pageDuration;

    console.log(`[Transcript] Player data: status=${status}, duration=${duration}s`);

    if (status !== 'OK') return null;
    return { playerData, duration };
  } catch (e) {
    console.log(`[Transcript] fetchPlayerData error: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

/**
 * Main entry point. Tries strategies in order:
 * 1. Captions from InnerTube (fastest, most reliable)
 * 2. youtube-transcript package (fallback)
 * 3. Audio download + Whisper (for videos with no captions)
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptResult> {
  const errors: string[] = [];

  // Fetch player data once — shared by strategies 1 and 3
  const playerResult = await fetchPlayerData(videoId);
  const playerData = playerResult?.playerData ?? null;
  const duration = playerResult?.duration ?? 0;

  // Strategy 1: Captions from InnerTube
  if (playerData) {
    try {
      console.log(`[Transcript] Strategy 1: captions for ${videoId}`);
      const result = await extractCaptions(playerData, duration);
      if (result) { console.log('[Transcript] Strategy 1 succeeded'); return result; }
      errors.push('innertube: no captions found');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'failed';
      errors.push(`innertube: ${msg}`);
    }
  } else {
    errors.push('innertube: could not load player data');
  }

  // Strategy 2: youtube-transcript package
  try {
    console.log(`[Transcript] Strategy 2: youtube-transcript for ${videoId}`);
    const result = await youtubeTranscriptFallback(videoId);
    if (result) { console.log('[Transcript] Strategy 2 succeeded'); return result; }
    errors.push('youtube-transcript: no segments');
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'failed';
    console.log(`[Transcript] Strategy 2 failed: ${msg}`);
    errors.push(`youtube-transcript: ${msg}`);
  }

  // Strategy 3: Audio + Whisper (no captions needed)
  if (playerData) {
    try {
      console.log(`[Transcript] Strategy 3: whisper for ${videoId}`);
      const result = await whisperFromPlayerData(playerData, duration);
      console.log('[Transcript] Strategy 3 succeeded');
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'failed';
      console.log(`[Transcript] Strategy 3 failed: ${msg}`);
      errors.push(`whisper: ${msg}`);
    }
  } else {
    errors.push('whisper: no player data (video may be age-restricted or require login)');
  }

  console.error('[Transcript] All strategies failed:', errors);
  throw new TranscriptError(
    `Could not get a transcript for this video. ${errors.join(' | ')}`
  );
}

// ─── Strategy 1: Extract captions ──────────────────────────────────

async function extractCaptions(playerData: PlayerData, duration: number): Promise<TranscriptResult | null> {
  const tracks = playerData.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks || tracks.length === 0) return null;

  console.log(`[Transcript] S1: ${tracks.length} caption track(s) available`);

  const track =
    tracks.find((t: { languageCode: string; kind?: string }) => t.languageCode === 'en' && t.kind !== 'asr') ||
    tracks.find((t: { languageCode: string }) => t.languageCode === 'en') ||
    tracks.find((t: { kind?: string }) => t.kind !== 'asr') ||
    tracks[0];

  if (!track?.baseUrl) return null;

  const text = await fetchCaptionXml(track.baseUrl);
  if (!text) return null;

  return buildResult(text, duration);
}

async function fetchCaptionXml(baseUrl: string): Promise<string | null> {
  const url = baseUrl.replace('&fmt=srv3', '');
  const res = await fetch(url);
  if (!res.ok) return null;

  const body = await res.text();
  if (!body) return null;

  const textMatches = body.match(/<text[^>]*>([\s\S]*?)<\/text>/g);
  if (textMatches?.length) {
    const texts = textMatches.map(m => decodeXml(m.replace(/<[^>]+>/g, '')).trim()).filter(Boolean);
    if (texts.length) return cleanText(texts);
  }

  const pMatches = body.match(/<p [^>]*>([\s\S]*?)<\/p>/g);
  if (pMatches?.length) {
    const texts = pMatches.map(m => decodeXml(m.replace(/<[^>]+>/g, '')).trim()).filter(Boolean);
    if (texts.length) return cleanText(texts);
  }

  return null;
}

function decodeXml(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d)));
}

// ─── Strategy 2: youtube-transcript package ────────────────────────

async function youtubeTranscriptFallback(videoId: string): Promise<TranscriptResult | null> {
  const segments = await YoutubeTranscript.fetchTranscript(videoId);
  if (!segments?.length) return null;

  const text = cleanText(segments.map(s => s.text));
  if (!text) return null;

  const last = segments[segments.length - 1];
  return buildResult(text, Math.ceil((last.offset + last.duration) / 1000));
}

// ─── Strategy 3: Audio stream + Whisper ───────────────────────────

async function whisperFromPlayerData(playerData: PlayerData, duration: number): Promise<TranscriptResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new TranscriptError('OpenAI API key missing.');

  const formats: Array<{ itag: number; mimeType?: string; url?: string; signatureCipher?: string }> =
    playerData.streamingData?.adaptiveFormats ?? [];

  console.log(`[Transcript] S3: ${formats.length} formats, plain-url count: ${formats.filter(f => f.url).length}`);

  const audio =
    formats.find(f => f.itag === 140 && f.url) ||
    formats.find(f => f.itag === 251 && f.url) ||
    formats.find(f => f.mimeType?.startsWith('audio/') && f.url);

  if (!audio?.url) throw new TranscriptError('No downloadable audio stream found.');

  const audioRes = await fetch(audio.url, {
    headers: { Range: `bytes=0-${WHISPER_MAX_BYTES - 1}` },
  });

  if (!audioRes.ok && audioRes.status !== 206) {
    throw new TranscriptError(`Audio download HTTP ${audioRes.status}`);
  }

  const buf = Buffer.from(await audioRes.arrayBuffer());
  if (!buf.length) throw new TranscriptError('Empty audio download.');

  console.log(`[Transcript] S3: ${buf.length} bytes, sending to Whisper`);

  const mime = audio.mimeType?.split(';')[0] ?? 'audio/mp4';
  const ext = mime.includes('webm') ? 'webm' : 'm4a';
  const openai = new OpenAI({ apiKey });
  const file = new File([new Uint8Array(buf)], `audio.${ext}`, { type: mime });
  const response = await openai.audio.transcriptions.create({ model: 'whisper-1', file, response_format: 'text' });

  const text = typeof response === 'string' ? response : String(response);
  if (!text?.trim()) throw new TranscriptError('Whisper returned empty transcript.');

  return buildResult(text.trim(), duration);
}

// ─── Utilities ─────────────────────────────────────────────────────

function cleanText(texts: string[]): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of texts) {
    const t = raw.replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim();
    if (t && !seen.has(t)) { seen.add(t); out.push(t); }
  }
  return out.join(' ').replace(/\s+/g, ' ').trim();
}

function buildResult(text: string, durationSeconds: number): TranscriptResult {
  return { text, hash: createHash('sha256').update(text).digest('hex'), chunks: chunkTranscript(text), durationSeconds };
}

export function chunkTranscript(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) return [text];
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length > MAX_CHUNK_CHARS) {
      if (current) { chunks.push(current.trim()); current = ''; }
      if (s.length > MAX_CHUNK_CHARS) {
        const words = s.split(' ');
        let wc = '';
        for (const w of words) {
          if ((wc + ' ' + w).length > MAX_CHUNK_CHARS) { chunks.push(wc.trim()); wc = w; }
          else wc += ' ' + w;
        }
        if (wc) current = wc;
      } else { current = s; }
    } else { current += s; }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export class TranscriptError extends Error {
  constructor(message: string) { super(message); this.name = 'TranscriptError'; }
}
