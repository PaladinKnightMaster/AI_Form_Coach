import { Container, Section, Badge } from '@/ui/DS';

const faqs = [
  {
    question: "How does AI form coaching work?",
    answer: "Our AI uses advanced computer vision to analyze your body movements in real-time through your camera. It provides instant feedback on your form, counts reps, and alerts you to potential issues that could lead to injury."
  },
  {
    question: "What exercises are supported?",
    answer: "Currently, we support squats, push-ups, planks, and several other bodyweight exercises. We're constantly adding new exercises based on user feedback and demand."
  },
  {
    question: "Do I need special equipment?",
    answer: "No special equipment needed! Just a device with a camera (smartphone, tablet, or computer) and enough space to perform your exercises. The AI works with any standard camera."
  },
  {
    question: "Is my workout data private?",
    answer: "Absolutely. Your workout data is encrypted and stored securely. We never share your personal information or workout data with third parties. You have full control over your data."
  },
  {
    question: "Can I use this offline?",
    answer: "The AI form coaching requires an internet connection for real-time analysis. However, you can view your workout history and some features offline once they're cached on your device."
  },
  {
    question: "What's included in the free plan?",
    answer: "The free plan includes basic AI form coaching for supported exercises, workout tracking, and access to your workout history. Premium features include advanced analytics, custom workout plans, and nutrition tracking."
  },
  {
    question: "How accurate is the AI feedback?",
    answer: "Our AI has been trained on thousands of hours of exercise data and achieves over 95% accuracy in form analysis. However, it's designed to complement, not replace, professional fitness guidance."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time. Your premium features will remain active until the end of your billing cycle, and you can always resubscribe later."
  }
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-slate-900 dark:via-violet-900/30 dark:to-fuchsia-900/30">
      <Section className="py-20">
        <Container>
          <div className="text-center space-y-6 mb-16">
            <div className="space-y-4">
              <Badge tone="info" size="lg" className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800">
                ❓ Frequently Asked Questions
              </Badge>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                Got Questions? We've Got Answers
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Find answers to the most common questions about AI Form Coach and how it can help transform your fitness journey.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid gap-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-16">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Still have questions?
                </h3>
                <p className="text-gray-600 mb-6">
                  Can't find what you're looking for? We're here to help!
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a href="mailto:support@aiformcoach.com" className="btn btn-primary">
                    Contact Support
                  </a>
                  <a href="/coach" className="btn btn-secondary">
                    Try It Free
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
