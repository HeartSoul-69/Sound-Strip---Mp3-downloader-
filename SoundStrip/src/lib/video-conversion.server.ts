import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import ffmpegPath from 'ffmpeg-static';
import ipaddr from 'ipaddr.js';
import { apiError } from '@/lib/api.server';

if (!ffmpegPath) throw new Error('ffmpeg-static did not provide a binary path. Run npm install to download it.');
const binary: string = ffmpegPath;
const MAX_BYTES = 60 * 1024 * 1024;
let active = 0;

/** Hosts we hand off to yt-dlp instead of treating as direct video files. */
const YOUTUBE_RE = /(?:^|\.)(?:youtube\.com|youtu\.be|music\.youtube\.com|m\.youtube\.com|youtube-nocookie\.com)$/;

function isYouTube(hostname: string): boolean {
	return YOUTUBE_RE.test(hostname.replace(/^\[|\]$/g, ''));
}

/** Resolve the yt-dlp binary. Checks the bundled `bin/` directory first, then falls back to `yt-dlp` on PATH. */
function resolveYtDlp(): string {
	const isWin = process.platform === 'win32';
	const bundled = join(process.cwd(), 'bin', isWin ? 'yt-dlp.exe' : 'yt-dlp');
	if (existsSync(bundled)) return bundled;
	// Fall back to a system-installed yt-dlp available on PATH.
	return isWin ? 'yt-dlp.exe' : 'yt-dlp';
}

async function download(target: string, redirects = 0, maxBytes = MAX_BYTES): Promise<Buffer> {
	let url: URL;
	try { url = new URL(target); } catch { throw apiError(422, 'Enter a valid public video URL.'); }
	if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || (url.port && !['80', '443'].includes(url.port))) throw apiError(422, 'Use a public HTTP or HTTPS video link on a standard port.');
	const hostname = url.hostname.replace(/^\[|\]$/g, '');
	if (/(^|\.)(vimeo\.com|tiktok\.com|instagram\.com|facebook\.com)$/.test(hostname)) throw apiError(422, 'This platform page is not supported. Paste a YouTube link or a direct .mp4, .webm, or .mov file URL instead.');
	const addresses = await lookup(hostname, { all: true }).catch(() => { throw apiError(422, 'We could not find that host. Check your link and try again.'); });
	if (!addresses.length || addresses.some(({ address }) => ipaddr.process(address).range() !== 'unicast')) throw apiError(422, 'Only public internet video URLs are supported.');
	const selected = addresses[0];
	const result = await new Promise<{ body?: Buffer; redirect?: string }>((resolve, reject) => {
	const req = (url.protocol === 'https:' ? httpsRequest : httpRequest)({
	hostname: selected.address, family: selected.family, servername: hostname,
	port: url.port || (url.protocol === 'https:' ? 443 : 80), path: url.pathname + url.search,
	headers: { Host: url.host, 'User-Agent': 'Soundstrip/1.0', Accept: 'video/*,audio/*,application/octet-stream' },
	}, res => {
	if ([301, 302, 303, 307, 308].includes(res.statusCode ?? 0) && res.headers.location) { res.resume(); resolve({ redirect: new URL(res.headers.location, url).href }); return; }
	if (res.statusCode !== 200) { res.resume(); reject(apiError(422, `The video host returned ${res.statusCode}. Check that your link is public and downloadable.`)); return; }
	const type = res.headers['content-type'] ?? '';
	if (type.includes('text/html') || type.includes('application/json')) { res.resume(); reject(apiError(422, 'That link opens a web page. Paste the direct URL of a video file instead.')); return; }
	if (Number(res.headers['content-length']) > maxBytes) { res.destroy(); reject(apiError(422, 'This file exceeds the size limit. Please use a shorter video.')); return; }
	const chunks: Buffer[] = []; let size = 0;
	res.on('data', (chunk: Buffer) => { size += chunk.length; if (size > maxBytes) { res.destroy(); reject(apiError(422, 'This file exceeds the size limit. Please use a shorter video.')); } else chunks.push(chunk); });
	res.on('end', () => resolve({ body: Buffer.concat(chunks) }));
	res.on('error', () => reject(apiError(422, 'The video download was interrupted. Try again.')));
	});
	const timeout = setTimeout(() => req.destroy(new Error('Download timed out')), 45000);
	req.on('close', () => clearTimeout(timeout));
	req.on('error', () => reject(apiError(422, 'The video host could not be reached or took too long. Try a different link.')));
	req.end();
	});
	if (result.redirect) { if (redirects >= 4) throw apiError(422, 'This link redirects too many times. Use a direct video link.'); return download(result.redirect, redirects + 1, maxBytes); }
	if (!result.body?.length) throw apiError(422, 'The video file is empty.');
	return result.body;
}

const AUDIO_MAX = 80 * 1024 * 1024;

async function assertPublicUrl(target: string): Promise<void> {
	let url: URL;
	try { url = new URL(target); } catch { throw apiError(422, 'Enter a valid public video URL.'); }
	if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw apiError(422, 'Only public internet video URLs are supported.');
	const hostname = url.hostname.replace(/^[\[]|[\]]$/g, '');
	const addresses = await lookup(hostname, { all: true }).catch(() => { throw apiError(422, 'We could not find that host. Check your link and try again.'); });
	if (!addresses.length || addresses.some(({ address }) => ipaddr.process(address).range() !== 'unicast')) throw apiError(422, 'Only public internet video URLs are supported.');
}

function transcodeMp3(input: Buffer, bitrate: number): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const child = spawn(binary, ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-vn', '-t', '1800', '-codec:a', 'libmp3lame', '-b:a', `${bitrate}k`, '-f', 'mp3', 'pipe:1'], { stdio: ['pipe', 'pipe', 'pipe'] });
		const chunks: Buffer[] = [];
		let size = 0;
		const timer = setTimeout(() => { child.kill('SIGKILL'); reject(apiError(422, 'Conversion took too long. Try a shorter video.')); }, 90000);
		child.stdout.on('data', (chunk: Buffer) => { size += chunk.length; if (size > AUDIO_MAX) { child.kill('SIGKILL'); reject(apiError(422, 'The resulting audio file is too large. Try a shorter video.')); } else chunks.push(chunk); });
		child.stderr.resume();
		child.stdin.on('error', () => { /* Exit status reports invalid input. */ });
		child.on('error', error => { clearTimeout(timer); reject(error); });
		child.on('close', code => { clearTimeout(timer); if (code !== 0 || !size) reject(apiError(422, 'We could not extract an audio track from this video.')); else resolve(Buffer.concat(chunks)); });
		child.stdin.end(input);
	});
}

/** YouTube bot-walls this server on many videos. A public extractor still returns the audio. */
async function convertViaPublicExtractor(pageUrl: string, bitrate: number): Promise<Buffer> {
	const started = await fetch(`https://loader.to/ajax/download.php?format=mp3&url=${encodeURIComponent(pageUrl)}`, {
		headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json', Referer: 'https://loader.to/' },
		signal: AbortSignal.timeout(20000),
	});
	if (!started.ok) throw apiError(422, 'YouTube blocked this video and the backup extractor could not start. Try another link.');
	const job = await started.json() as { progress_url?: string };
	if (!job.progress_url) throw apiError(422, 'YouTube blocked this video. Try another link, or paste a direct video file URL.');
	await assertPublicUrl(job.progress_url);
	let downloadUrl = '';
	const deadline = Date.now() + 90000;
	while (Date.now() < deadline) {
		await new Promise(resolve => setTimeout(resolve, 1500));
		const progress = await fetch(job.progress_url, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://loader.to/' }, signal: AbortSignal.timeout(15000) }).catch(() => null);
		if (!progress?.ok) continue;
		const data = await progress.json() as { download_url?: string; text?: string };
		if (data.download_url) { downloadUrl = data.download_url; break; }
		const text = (data.text || '').toLowerCase();
		if (text.includes('error') || text.includes('unavailable') || text.includes('not found')) break;
	}
	if (!downloadUrl) throw apiError(422, 'YouTube is still blocking this video. Try another video, or paste a direct video file URL instead.');
	await assertPublicUrl(downloadUrl);
	const audio = await download(downloadUrl, 0, AUDIO_MAX);
	if (audio.length >= 128 && (audio.subarray(0, 3).toString() === 'ID3' || audio[0] === 0xff)) {
		return bitrate === 320 ? audio : transcodeMp3(audio, bitrate);
	}
	throw apiError(422, 'The backup extractor did not return an audio file. Try another video.');
}

/** Convert a YouTube link to MP3 via yt-dlp (handles signatures, formats, headers). */
async function convertWithYtDlp(url: string, bitrate: number): Promise<Buffer> {
	const ytDlp = resolveYtDlp();
	const directory = await mkdtemp(join(tmpdir(), 'soundstrip-yt-'));
	try {
		const outcome = await new Promise<{ code: number; stderr: string }>((resolve, reject) => {
			const child = spawn(ytDlp, [
				'--no-warnings', '--no-playlist', '--no-progress', '--no-cache-dir',
				'--socket-timeout', '30', '--retries', '3',
				'--ffmpeg-location', binary,
				'--extractor-args', 'youtube:player_client=android,tv,web_safari',
				'-f', 'bestaudio/best',
				'-x', '--audio-format', 'mp3', '--audio-quality', `${bitrate}K`,
				'--postprocessor-args', 'ffmpeg:-vn -t 1800',
				'--no-part',
				'-o', join(directory, 'audio.%(ext)s'),
				url,
			], { stdio: ['ignore', 'ignore', 'pipe'] });
			let stderr = '';
			child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
			const timer = setTimeout(() => { child.kill('SIGKILL'); reject(apiError(422, 'Conversion took too long. Try a shorter video.')); }, 120000);
			child.on('error', error => { clearTimeout(timer); reject(error); });
			child.on('close', code => { clearTimeout(timer); resolve({ code: code ?? 1, stderr }); });
		});
		if (outcome.code !== 0) {
			const text = outcome.stderr.toLowerCase();
			if (text.includes('sign in to confirm') || text.includes('not a bot') || text.includes('captcha')) {
				return await convertViaPublicExtractor(url, bitrate);
			}
			if (text.includes('private') || text.includes('unavailable') || text.includes('does not exist') || text.includes('no longer')) {
				throw apiError(422, 'That YouTube video could not be reached. Check that the link is public and try again.');
			}
			if (text.includes('age')) {
				throw apiError(422, 'This video is age-restricted and cannot be converted. Try another video.');
			}
			throw apiError(422, 'We could not convert this YouTube video. Try another link or a direct video file URL.');
		}
		let buffer: Buffer;
		try { buffer = await readFile(join(directory, 'audio.mp3')); } catch { throw apiError(422, 'We could not extract an audio track from this video.'); }
		if (!buffer.length) throw apiError(422, 'We could not extract an audio track from this video.');
		if (buffer.length > 80 * 1024 * 1024) throw apiError(422, 'The resulting audio file is too large. Try a shorter video.');
		return buffer;
	} finally { await rm(directory, { recursive: true, force: true }); }
}

export async function convertVideo(url: string, bitrate: number): Promise<Buffer> {
	if (active >= 3) throw apiError(429, 'The converter is busy. Please try again in a moment.');
	active++;
	let directory: string | undefined;
	try {
		let parsed: URL;
		try { parsed = new URL(url); } catch { throw apiError(422, 'Enter a valid public video URL.'); }
		if (isYouTube(parsed.hostname)) return await convertWithYtDlp(url, bitrate);
		const input = await download(url);
		const magic = input.subarray(4, 8).toString('ascii');
		const format = input.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) ? 'matroska' : ['ftyp', 'moov', 'mdat', 'wide', 'free'].includes(magic) ? 'mov' : null;
		if (!format) throw apiError(422, 'This is not a supported video file. Use an MP4, WebM, or MOV file.');
		directory = await mkdtemp(join(tmpdir(), 'soundstrip-'));
		const inputPath = join(directory, 'source');
		await writeFile(inputPath, input, { mode: 0o600 });
		return await new Promise<Buffer>((resolve, reject) => {
		const child = spawn(binary, ['-hide_banner', '-loglevel', 'error', '-protocol_whitelist', 'file,pipe', '-f', format, '-i', inputPath, '-map', '0:a:0', '-vn', '-t', '1800', '-codec:a', 'libmp3lame', '-b:a', `${bitrate}k`, '-f', 'mp3', 'pipe:1'], { stdio: ['pipe', 'pipe', 'pipe'] });
		const chunks: Buffer[] = []; let size = 0;
		const timer = setTimeout(() => { child.kill('SIGKILL'); reject(apiError(422, 'Conversion took too long. Try a shorter video.')); }, 90000);
		child.stdout.on('data', (chunk: Buffer) => { size += chunk.length; if (size > 80 * 1024 * 1024) { child.kill('SIGKILL'); reject(apiError(422, 'The resulting audio file is too large.')); } else chunks.push(chunk); });
		child.stderr.resume();
		child.stdin.on('error', () => { /* Exit status reports invalid input. */ });
		child.on('error', error => { clearTimeout(timer); reject(error); });
		child.on('close', code => { clearTimeout(timer); if (code !== 0 || !size) reject(apiError(422, 'We could not read an audio track. Use a playable, unprotected MP4, WebM, or MOV file with audio.')); else resolve(Buffer.concat(chunks)); });
		child.stdin.end();
		});
	} finally { active--; if (directory) await rm(directory, { recursive: true, force: true }); }
}
