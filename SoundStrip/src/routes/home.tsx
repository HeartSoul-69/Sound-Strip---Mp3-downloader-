import type { Route } from './+types/home';
import { seo } from '@/lib/seo';
import { Converter } from '@/components/home/converter';
import { HowItWorks } from '@/components/home/how-it-works';
import { Questions } from '@/components/home/questions';
import { questions } from '@/data/help';

export function meta({ matches, location }: Route.MetaArgs) {
 return seo({ matches, location }, {
  title: 'Soundstrip — Video in. Audio out.',
  description: 'Convert YouTube links and public video file links into downloadable MP3 audio with Soundstrip. Choose your quality, preview the result, and keep the sound.',
  image: 'https://images.hostinger.com/13496dd3-0845-4bc2-ba2b-1b6dac7cdae5/0b702e47-fce7-4e5e-8823-471d280023be.png',
  jsonLd: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Soundstrip', description: 'Public video file links to MP3 audio.' }, { '@context': 'https://schema.org', '@type': 'Organization', name: 'Soundstrip' }, { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: questions.map(question => ({ '@type': 'Question', name: question.title, acceptedAnswer: { '@type': 'Answer', text: question.answer } })) }],
 });
}
export default function HomePage() { return <><Converter/><HowItWorks/><Questions/></>; }
