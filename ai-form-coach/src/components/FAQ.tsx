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
		question: "How accurate is the coaching?",
		answer: "Our form analysis uses proven computer vision technology, achieving 90%+ accuracy in good lighting. You'll get real-time tips for common issues like squat depth, pushup alignment, and movement tempo."
	},
	{
		question: "Does it work on phones?",
		answer: "Yes! Works on modern smartphones and tablets with front cameras. For best results, use landscape mode and good lighting."
	},
	{
		question: "How can I improve tracking quality?",
		answer: "Use good lighting, stay fully in frame, wear contrasting colors, and keep your camera steady. The green light indicator shows when you're positioned correctly."
	},
	{
		question: "Can I use it offline?",
		answer: "Yes, once loaded, the coaching works offline. Your workout data saves locally and syncs when you're back online. Perfect for gyms with poor internet."
	},
	{
		question: "What does Pro include?",
		answer: "Pro adds unlimited workout history, detailed progress charts, custom training plans, priority support, and early access to new exercises. Free users get 10 recent sessions and basic coaching."
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
					<h2 className="font-bold mb-2">Questions & Answers</h2>
					<p className="opacity-80">Everything you need to know about getting started</p>
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