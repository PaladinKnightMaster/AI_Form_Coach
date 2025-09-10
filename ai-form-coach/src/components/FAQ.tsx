"use client";
import { useState } from 'react';
import { Icon } from '@/ui/DS';

interface FAQItem {
	question: string;
	answer: string;
}

const faqData: FAQItem[] = [
	{
		question: "Do you store or upload my video?",
		answer: "No, never. All pose detection runs locally in your browser using MediaPipe. Your video stream never leaves your device—we only receive motion summaries that you control."
	},
	{
		question: "How accurate is the AI coaching?",
		answer: "Our form analysis is built on MediaPipe's proven pose detection, achieving 90%+ accuracy in controlled conditions. The AI provides real-time cues for common form issues like depth, alignment, and tempo."
	},
	{
		question: "Does it work on mobile devices?",
		answer: "Yes! The coach works on modern smartphones and tablets with front-facing cameras. For the best experience, we recommend using landscape mode and ensuring good lighting."
	},
	{
		question: "How can I improve pose tracking quality?",
		answer: "Ensure good lighting, position yourself fully in frame, wear contrasting colors, and maintain a stable camera position. The pose quality indicator will help you find the optimal setup."
	},
	{
		question: "Can I use it offline?",
		answer: "Yes, once loaded, the core coaching features work offline. Your session data is stored locally and synced when you're back online. Perfect for gym environments with poor connectivity."
	},
	{
		question: "What does Pro include?",
		answer: "Pro adds unlimited session history, advanced analytics, custom workout plans, priority support, and early access to new exercises. Free users get 10 recent sessions and basic coaching."
	}
];

export default function FAQ() {
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	const toggleItem = (index: number) => {
		setOpenIndex(openIndex === index ? null : index);
		// Track FAQ interaction
		import('@/lib/analytics').then(({ analytics }) => {
			analytics.faqExpand(faqData[index].question);
		}).catch(() => {});
	};

	const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleItem(index);
			// Track FAQ interaction
			import('@/lib/analytics').then(({ analytics }) => {
				analytics.faqExpand(faqData[index].question);
			}).catch(() => {});
		}
	};

	return (
		<section className="section">
			<div className="container">
				<div className="text-center mb-8">
					<h2 className="font-bold mb-2">Frequently Asked Questions</h2>
					<p className="opacity-80">Everything you need to know about AI Form Coach</p>
				</div>
				<div className="max-w-3xl mx-auto space-y-2">
					{faqData.map((item, index) => (
						<div key={index} className="card">
							<button
								className="w-full px-4 py-4 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-md"
								onClick={() => toggleItem(index)}
								onKeyDown={(e) => handleKeyDown(e, index)}
								aria-expanded={openIndex === index}
								aria-controls={`faq-answer-${index}`}
								id={`faq-question-${index}`}
							>
								<span className="font-medium pr-4">{item.question}</span>
								<Icon 
									name={openIndex === index ? 'chevron-up' : 'chevron-down'} 
									className="flex-shrink-0 transition-transform duration-200" 
								/>
							</button>
							<div
								id={`faq-answer-${index}`}
								role="region"
								aria-labelledby={`faq-question-${index}`}
								className={`overflow-hidden transition-all duration-300 ease-in-out ${
									openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
								}`}
							>
								<div className="px-4 pb-4 text-sm opacity-80 leading-relaxed">
									{item.answer}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
} 