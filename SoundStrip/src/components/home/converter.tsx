import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, AudioLines, Check, CheckCircle2, ChevronDown, Clipboard, Download, FileAudio, Link2, LoaderCircle, LockKeyhole, RotateCcw, SlidersHorizontal, X } from 'lucide-react';

const bars = [17,26,39,22,48,31,55,37,65,45,26,58,72,48,37,63,44,76,53,34,60,42,27,52,69,43,30,58,38,73,48,29,61,40,25,55,36,64,46,29,50,35,22,40,28,17];
export function Converter() {
 const [url, setUrl] = useState('');
 const [bitrate, setBitrate] = useState(192);
 const [advanced, setAdvanced] = useState(false);
 const [filename, setFilename] = useState('soundstrip-audio');
 const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle');
 const [error, setError] = useState('');
 const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
 const controller = useRef<AbortController | null>(null);
 useEffect(() => () => controller.current?.abort(), []);
 useEffect(() => { if (result) return () => URL.revokeObjectURL(result.url); }, [result]);
 async function convert(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); setError('');
  try { const parsed = new URL(url); if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(); } catch { setError('Paste a valid HTTP or HTTPS video link to get started.'); return; }
  setStatus('working'); setResult(null);
  const abort = new AbortController(); controller.current = abort;
  try {
   const response = await fetch('/api/convert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, bitrate, filename }), signal: abort.signal });
   if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Something went wrong with the conversion. Please try again.'); }
   const blob = await response.blob();
   setResult({ url: URL.createObjectURL(blob), name: `${filename.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80) || 'soundstrip-audio'}.mp3`, size: blob.size });
   setStatus('done');
  } catch (cause) {
   if (cause instanceof Error && cause.name === 'AbortError') { setStatus('idle'); return; }
   setError(cause instanceof Error ? cause.message : 'We could not convert this link. Try again.'); setStatus('idle');
  } finally { controller.current = null; }
 }
 async function paste() { try { setUrl(await navigator.clipboard.readText()); setError(''); } catch { setError('Clipboard access is unavailable. Paste your link into the field with your keyboard.'); } }
 function reset() { setStatus('idle'); setResult(null); setError(''); }
 return <section id="converter" className="converter-section">
  <div className="page-intro"><div><div className="eyebrow"><span/>THE GOOD PART, ON REPEAT</div><h1>Video in.<br className="mobile-break"/> <span>Audio out.</span></h1><p>Turn a video link into an MP3. Keep the sound. Skip the screen.</p></div><div className="intro-stamp"><AudioLines size={25}/><span>JUST<br/>THE AUDIO.</span></div></div>
  <div className="conversion-layout">
   <div className="converter-card">
    <div className="converter-card-heading"><span className="section-number">01 /</span><h2>Let’s hear it.</h2><span className="format-tag">VIDEO → MP3</span></div>
    <form onSubmit={convert}>
     <label htmlFor="video-url" className="field-label">Video link</label>
     <div className="url-input"><Link2 size={20}/><input id="video-url" type="url" placeholder="Paste your video link here..." value={url} onChange={e => { setUrl(e.target.value); setError(''); }} required disabled={status === 'working'} autoComplete="off"/><button type="button" onClick={paste} disabled={status === 'working'} aria-label="Paste video link"><Clipboard size={16}/><span>Paste</span></button></div>
     <p className="field-hint">A YouTube link, or a direct public video file URL (MP4, WebM, MOV).</p>
     <div className="quality-heading"><label className="field-label" id="quality-label">Audio quality</label><span>Make it sound like you.</span></div>
     <div className="quality-options" role="radiogroup" aria-labelledby="quality-label">{[{ value: 128, title: 'Standard', detail: 'Smaller file' }, { value: 192, title: 'High', detail: 'The sweet spot' }, { value: 320, title: 'Best', detail: 'Fuller sound' }].map(option => <button key={option.value} type="button" role="radio" aria-checked={bitrate === option.value} className={`quality-option ${bitrate === option.value ? 'selected' : ''}`} onClick={() => setBitrate(option.value)} disabled={status === 'working'}><div><span>{option.title}</span><span className="radio-dot">{bitrate === option.value && <Check size={11}/>}</span></div><strong>{option.value}<small> kbps</small></strong><p>{option.detail}</p>{option.value === 192 && <span className="recommended">RECOMMENDED</span>}</button>)}</div>
     <button type="button" className="advanced-toggle" onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}><SlidersHorizontal size={15}/>Advanced settings<ChevronDown size={15} className={advanced ? 'rotate' : ''}/></button>
     {advanced && <div className="advanced-panel"><label className="field-label" htmlFor="filename">Download filename</label><div className="filename-input"><input id="filename" value={filename} onChange={e => setFilename(e.target.value)} maxLength={80} disabled={status === 'working'} required/><span>.mp3</span></div><p className="field-hint">MP3 output · up to 30 minutes of audio · 60 MB source limit</p></div>}
     {error && <div className="error-message" role="alert">{error}</div>}
     <button className="convert-button" type="submit" disabled={status === 'working'}>{status === 'working' ? <><LoaderCircle className="spin" size={19}/>Converting your audio…</> : <><AudioLines size={20}/>Convert to MP3<ArrowRight size={20}/></>}</button>
     {status === 'working' && <div className="working-note" role="status"><span>Fetching your video and extracting its audio.</span><button type="button" onClick={() => controller.current?.abort()}><X size={13}/>Cancel</button></div>}
     <div className="converter-footnote"><LockKeyhole size={13}/>No sign-up. No files retained. Just your MP3.</div>
    </form>
   </div>
   <aside className="output-preview" aria-label="Audio output preview"><div className="preview-heading"><span>{result ? 'YOUR AUDIO IS READY' : 'THE OTHER SIDE'}</span><span className="preview-dot"/></div><div className="file-art"><div className="paper-file"><span className="paper-fold"/><AudioLines size={48} strokeWidth={1.5}/><strong>MP3</strong></div><span className="audio-sticker"><ArrowDown size={15}/>{bitrate} KBPS</span></div><div className={`waveform ${status === 'working' ? 'is-working' : ''}`}>{bars.map((height, index) => <i key={index} style={{ height: `${height}%`, animationDelay: `${index * 0.04}s` }}/>)}</div><div className="preview-copy">{result ? <><h3><CheckCircle2 size={19}/>Ready for your ears.</h3><p>{result.name} · {(result.size / 1024 / 1024).toFixed(1)} MB</p><audio controls src={result.url} aria-label="Preview converted MP3"/><a className="download-button" href={result.url} download={result.name}><Download size={17}/>Download MP3</a><button className="reset-button" onClick={reset}><RotateCcw size={14}/>Convert another video</button></> : <><h3>All sound.<br/>No strings attached.</h3><p>Your audio will be ready to<br/>download right here.</p><div className="output-type"><FileAudio size={14}/>MP3 AUDIO FILE</div></>}</div><span className="preview-caption">SOUND, SIMPLIFIED. / 001</span></aside>
  </div>
  <div className="assurance-strip"><span><CheckCircle2 size={16}/>Three quality options</span><span><LockKeyhole size={16}/>Files never retained</span><span><Download size={16}/>Yours to download</span><span className="strip-end">Less friction. More frequency.</span></div>
 </section>;
}
