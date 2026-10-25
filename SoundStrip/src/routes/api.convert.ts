import { apiError, readJsonBody, withApi } from '@/lib/api.server';
import { convertVideo } from '@/lib/video-conversion.server';

export const action = withApi(async ({ request }) => {
 const data = await readJsonBody<{ url?: string; bitrate?: number; filename?: string }>(request);
 if (typeof data.url !== 'string' || data.url.length > 4096 || ![128, 192, 320].includes(data.bitrate ?? 0)) return apiError(422, 'Enter a video link and choose a supported audio quality.');
 const mp3 = await convertVideo(data.url.trim(), data.bitrate!);
 const filename = (typeof data.filename === 'string' ? data.filename : 'soundstrip-audio').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80) || 'soundstrip-audio';
 return new Response(new Uint8Array(mp3), { headers: { 'Content-Type': 'audio/mpeg', 'Content-Disposition': `attachment; filename="${filename}.mp3"` } });
});
