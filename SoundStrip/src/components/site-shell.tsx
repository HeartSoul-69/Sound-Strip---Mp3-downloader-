import { AudioLines, ArrowUpRight, CircleHelp, Link2, ListMusic, ShieldCheck, Sparkles, PanelLeftClose, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

export function SiteShell({ children }: { children: React.ReactNode }) {
 const [open, setOpen] = useState(false);
 return <div className="app-shell">
  <aside className={`sidebar ${open ? 'is-open' : ''}`}>
   <Link className="brand" to="/" aria-label="Soundstrip home"><span className="brand-mark"><AudioLines size={22} strokeWidth={2.7}/></span>soundstrip<span className="brand-dot">.</span></Link>
   <button className="mobile-close icon-button" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={20}/></button>
   <div className="workspace-label">YOUR WORKSPACE</div>
   <nav aria-label="Main navigation">
    <a className="nav-item active" aria-current="page" href="#converter" onClick={() => setOpen(false)}><Link2 size={18}/>Video to MP3<span className="nav-key">01</span></a>
    <a className="nav-item" href="#how-it-works" onClick={() => setOpen(false)}><ListMusic size={18}/>How it works<ArrowUpRight size={15} className="nav-end"/></a>
   </nav>
   <div className="sidebar-note"><span className="small-square"><Sparkles size={17}/></span><h3>Less video.<br/>More listening.</h3><p>Your favorite audio, freed from the screen.</p><span className="note-rule"/></div>
   <div className="sidebar-bottom"><a className="nav-item" href="#questions" onClick={() => setOpen(false)}><CircleHelp size={18}/>Help & FAQs<ArrowUpRight size={15} className="nav-end"/></a><div className="private-note"><ShieldCheck size={16}/><span>No files retained. Just sound.</span></div><div className="sidebar-credit">MADE FOR YOUR EARS <AudioLines size={15}/></div></div>
  </aside>
  <div className="main-shell">
   <header className="topbar"><div className="breadcrumbs"><button className="mobile-menu icon-button" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20}/></button><PanelLeftClose size={17} className="desktop-icon"/><span className="crumb-divider"/><span>Workspace</span><span className="crumb-slash">/</span><strong>Video to MP3</strong></div><a className="top-help" href="#questions">Need a hand?<ArrowUpRight size={15}/></a></header>
   <main>{children}</main>
   <footer className="site-footer"><span>© 2026 soundstrip. Keep the good parts.</span><div><a href="#questions">Privacy & usage</a><span className="footer-status"><i/>All ears, no distractions</span></div></footer>
  </div>
 </div>;
}
