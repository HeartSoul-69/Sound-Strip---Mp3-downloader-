import { Plus, ArrowUpRight } from 'lucide-react';
import { questions } from '@/data/help';
export function Questions() {
 return <section className="questions-section" id="questions"><div className="questions-intro"><div className="eyebrow">A LITTLE CLARITY</div><h2>Good questions.<br/>Straight answers.</h2><a href="#converter">Back to the converter<ArrowUpRight size={16}/></a></div><div className="question-list">{questions.map(question => <details key={question.title}><summary>{question.title}<Plus size={18}/></summary><p>{question.answer}</p></details>)}</div></section>;
}
