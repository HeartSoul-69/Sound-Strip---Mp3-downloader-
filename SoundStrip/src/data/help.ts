export const steps = [
 { number: '01', title: 'Find your link.', description: 'Copy a YouTube link, or the direct URL of a public video file you have permission to use.' },
 { number: '02', title: 'Pick your quality.', description: 'Go light at 128 kbps, balanced at 192, or all-in at 320. Then hit convert.' },
 { number: '03', title: 'Take the sound.', description: 'Preview your audio and download the MP3. Listen wherever you like.' },
];
export const questions = [
 { title: 'What video links can I convert?', answer: 'Soundstrip converts YouTube links (youtube.com and youtu.be) as well as public, direct MP4, WebM, and MOV file URLs with an audio track. A direct link points to the video file itself, rather than a page containing a player. Signed URLs work while they are valid. Vimeo, TikTok, Instagram, and Facebook page links are not supported. Protected, private, age-restricted, or login-only videos cannot be converted.' },
 { title: 'Which audio quality should I choose?', answer: '128 kbps keeps files small and is useful for speech. 192 kbps is a balanced choice for everyday listening. 320 kbps uses more space and is best for music from a high-quality source. A higher bitrate does not restore details missing from the original audio.' },
 { title: 'Are there file or duration limits?', answer: 'Direct source files can be up to 60 MB. YouTube links and direct files are both capped at the first 30 minutes of audio. For longer recordings, split your video before converting.' },
 { title: 'What happens to my video and audio?', answer: 'Your link is sent to the server so it can fetch the source and convert its audio. The video is held in a temporary server file during processing, then deleted when the conversion finishes or fails. The audio is processed in memory. No media is retained in a file library or database. The MP3 remains available in this tab until you convert again or close the page, so download it before leaving. Do not submit sensitive or private links.' },
 { title: 'Can I convert any video I find online?', answer: 'Only convert content you own, content in the public domain, or content you have permission to download and convert. You are responsible for respecting copyright and the source host’s terms. Soundstrip does not bypass paywalls, authentication, or digital rights protection.' },
];
