import { ArrowUpRight, Clipboard, Settings2, Headphones } from 'lucide-react';
import { steps } from '@/data/help';
const icons = [Clipboard, Settings2, Headphones];
export function HowItWorks() {
 return <section className="how-section" id="how-it-works"><div className="section-heading"><h2>Three steps. Zero fuss.</h2><span>FROM LINK TO LISTEN<ArrowUpRight size={16}/></span></div><div className="steps">{steps.map((step, index) => { const Icon = icons[index]; return <article key={step.number} className="step"><div className="step-top"><span>{step.number}</span><Icon size={21} strokeWidth={1.5}/></div><h3>{step.title}</h3><p>{step.description}</p></article>; })}</div></section>;
}
