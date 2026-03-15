import { YoutubeTranscript } from 'youtube-transcript';
import { createHash } from 'crypto';
import OpenAI from 'openai';

const MAX_CHUNK_TOKENS = 12000;
const APPROX_CHARS_PER_TOKEN = 4;
const MAX_CHUNK_CHARS = MAX_CHUNK_TOKENS * APPROX_CHARS_PER_TOKEN;
const WHISPER_MAX_BYTES = 24 * 1024 * 1024;

const INNERTUBE_CONTEXT = {
  client: { clientName: 'ANDROID', clientVersion: '20.10.38' },
};

// Used as fallback for age/content-restricted videos (LOGIN_REQUIRED)
function getEmbedContext(videoId: string) {
  return {
    context: {
      client: { clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER', clientVersion: '2.0', clientScreen: 'EMBED' },
      thirdParty: { embedUrl: `https://www.youtube.com/embed/${videoId}` },
    },
    contentCheckOk: true,
    racyCheckOk: true,
  };
}

export interface TranscriptResult {
  text: string;
  hash: string;
  chunks: string[];
  durationSeconds: number;
}

/**
 * Fetch transcript with multiple fallback strategies.
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptResult> {
  const errors: string[] = [];

  // Strategy 1: Android InnerTube API (most reliable for captioned videos)
  try {
    console.log(`[Transcript] Strategy 1: Android InnerTube for ${videoId}`);
    const result = await strategy1_androidInnertube(videoId);
    if (result) { console.log('[Transcript] Strategy 1 succeeded'); return result; }
    errors.push('android-innertube: no captions found');
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'failed';
    console.log(`[Transcript] Strategy 1 failed: ${msg}`);
    errors.push(`android-innertube: ${msg}`);
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

  // Strategy 3: Audio download + Whisper (works even without captions)
  try {
    console.log(`[Transcript] Strategy 3: whisper for ${videoId}`);
    const result = await strategy3_whisper(videoId);
    console.log('[Transcript] Strategy 3 succeeded');
    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'failed';
    console.log(`[Transcript] Strategy 3 failed: ${msg}`);
    errors.push(`whisper: ${msg}`);
  }

  console.error('All transcript strategies failed:', errors);
  throw new TranscriptError(
    `Could not get a transcript for this video. ${errors.join(' | ')}`
  );
}

// ─── Strategy 1: Android InnerTube API ─────────────────────────────

async function strategy1_androidInnertube(videoId: string): Promise<TranscriptResult | null> {
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!pageRes.ok) return null;
  const html = await pageRes.text();

  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/);
  if (!apiKeyMatch) {
    console.log('[Transcript] S1: could not find INNERTUBE_API_KEY in page');
    return null;
  }
  const apiKey = apiKeyMatch[1];

  const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
  const pageDuration = durationMatch ? parseInt(durationMatch[1], 10) : 0;

  const playerRes = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: INNERTUBE_CONTEXT, videoId }),
    }
  );

  if (!playerRes.ok) {
    console.log(`[Transcript] S1: player API returned ${playerRes.status}`);
    return null;
  }

  let playerData = await playerRes.json();
  let playability = playerData.playabilityStatus?.status;
  console.log(`[Transcript] S1: playability=${playability}`);

  // Retry with embedded player context for age/content-restricted videos
  if (playability !== 'OK') {
    console.log('[Transcript] S1: retrying with embed context...');
    try {
      const embedRes = await fetch(
        `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId, ...getEmbedContext(videoId) }),
        }
      );
      if (embedRes.ok) {
        const embedData = await embedRes.json();
        const embedStatus = embedData.playabilityStatus?.status;
        console.log(`[Transcript] S1: embed context playability=${embedStatus}`);
        if (embedStatus === 'OK') { playerData = embedData; playability = 'OK'; }
      }
    } catch (e) {
      console.log(`[Transcript] S1: embed retry failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  if (playability !== 'OK') {
    console.log(`[Transcript] S1: all contexts failed, status=${playability}`);
    return null;
  }

  const duration = playerData.videoDetails?.lengthSeconds
    ? parseInt(playerData.videoDetails.lengthSeconds, 10)
    : pageDuration;

  const captionTracks = playerData.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!captionTracks || captionTracks.length === 0) {
    console.log('[Transcript] S1: no caption tracks in player response');
    return null;
  }

  console.log(`[Transcript] S1: found ${captionTracks.length} caption track(s)`);

  const track =
    captionTracks.find((t: { languageCode: string; kind?: string }) => t.languageCode === 'en' && t.kind !== 'asr') ||
    captionTracks.find((t: { languageCode: string }) => t.languageCode === 'en') ||
    captionTracks.find((t: { kind?: string }) => t.kind !== 'asr') ||
    captionTracks[0];

  const baseUrl: string = track.baseUrl;
  if (!baseUrl) return null;

  const text = await fetchCaptionText(baseUrl);
  if (!text) {
    console.log('[Transcript] S1: could not parse caption response');
    return null;
  }

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
  if (!body || body.length === 0) {
    console.log('[Transcript] fetchCaptionText: empty response body');
    return null;
  }

  console.log(`[Transcript] fetchCaptionText: got ${body.length} chars`);

  const textMatches = body.match(/<text[^>]*>([^<]*(?:<[^/][^>]*>[^<]*)*)<\/text>/g);
  if (textMatches && textMatches.length > 0) {
    const texts = textMatches.map(m => decodeXmlEntities(m.replace(/<[^>]+>/g, '')).trim()).filter(Boolean);
    if (texts.length > 0) { console.log(`[Transcript] parsed ${texts.length} <text> elements`); return cleanSegmentTexts(texts); }
  }

  const pMatches = body.match(/<p [^>]*>([\s\S]*?)<\/p>/g);
  if (pMatches && pMatches.length > 0) {
    const texts = pMatches.map(m => decodeXmlEntities(m.replace(/<[^>]+>/g, '')).trim()).filter(Boolean);
    if (texts.length > 0) { console.log(`[Transcript] parsed ${texts.length} <p> elements`); return cleanSegmentTexts(texts); }
  }

  console.log('[Transcript] fetchCaptionText: unrecognized XML format');
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

// ─── Strategy 3: Audio + Whisper (no captions needed) ─────────────

async function strategy3_whisper(videoId: string): Promise<TranscriptResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new TranscriptError('OpenAI API key required.');

  // Fetch page + player data independently for this strategy
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!pageRes.ok) throw new TranscriptError('Could not access this video.');
  const html = await pageRes.text();

  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/);
  if (!apiKeyMatch) throw new TranscriptError('Could not parse video page.');

  const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
  const duration = durationMatch ? parseInt(durationMatch[1], 10) : 0;

  const playerRes = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${apiKeyMatch[1]}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: INNERTUBE_CONTEXT, videoId }),
    }
  );
  if (!playerRes.ok) throw new TranscriptError(`Player API returned HTTP ${playerRes.status}`);

  let playerData = await playerRes.json();
  let status = playerData.playabilityStatus?.status;
  console.log(`[Transcript] S3: playability=${status}`);

  if (status !== 'OK') {
    console.log('[Transcript] S3: retrying with embed context...');
    try {
      const embedRes = await fetch(
        `https://www.youtube.com/youtubei/v1/player?key=${apiKeyMatch[1]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId, ...getEmbedContext(videoId) }),
        }
      );
      if (embedRes.ok) {
        const embedData = await embedRes.json();
        const embedStatus = embedData.playabilityStatus?.status;
        console.log(`[Transcript] S3: embed context playability=${embedStatus}`);
        if (embedStatus === 'OK') { playerData = embedData; status = 'OK'; }
      }
    } catch (e) {
      console.log(`[Transcript] S3: embed retry failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  if (status !== 'OK') throw new TranscriptError(`Video not accessible (${status})`);

  const formats: Array<{ itag: number; mimeType?: string; url?: string; signatureCipher?: string }> =
    playerData.streamingData?.adaptiveFormats ?? [];

  console.log(`[Transcript] S3: ${formats.length} formats, ${formats.filter(f => f.url).length} with plain URL`);

  const audio =
    formats.find(f => f.itag === 140 && f.url) ||
    formats.find(f => f.itag === 251 && f.url) ||
    formats.find(f => f.mimeType?.startsWith('audio/') && f.url);

  if (!audio?.url) throw new TranscriptError('No downloadable audio stream found.');

  const audioRes = await fetch(audio.url, {
    headers: { Range: `bytes=0-${WHISPER_MAX_BYTES - 1}` },
  });
  if (!audioRes.ok && audioRes.status !== 206) {
    throw new TranscriptError(`Audio download failed: HTTP ${audioRes.status}`);
  }

  const buf = Buffer.from(await audioRes.arrayBuffer());
  if (!buf.length) throw new TranscriptError('Downloaded audio is empty.');

  console.log(`[Transcript] S3: ${buf.length} bytes downloaded, sending to Whisper`);

  const mime = audio.mimeType?.split(';')[0] ?? 'audio/mp4';
  const ext = mime.includes('webm') ? 'webm' : 'm4a';
  const openai = new OpenAI({ apiKey });
  const file = new File([new Uint8Array(buf)], `audio.${ext}`, { type: mime });

  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    response_format: 'text',
  });

  const text = typeof response === 'string' ? response : String(response);
  if (!text?.trim()) throw new TranscriptError('Whisper returned empty transcript.');
  return buildResult(text.trim(), duration);
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
