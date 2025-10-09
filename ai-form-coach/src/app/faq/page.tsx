import { Container, Section, Badge } from '@/ui/DS';

const faqs = [
  {
    question: "How does AI form coaching work?",
    answer: "Our AI uses advanced computer vision to analyze your body movements in real-time through your camera. It provides instant feedback on your form, counts reps, and alerts you to potential issues that could lead to injury."
  },
  {
    question: "What does 'verified' mean for my sessions?",
    answer: "A verified session means your camera was properly positioned, lighting was adequate, and our AI could clearly see your full body throughout the workout. These sessions provide the most accurate form analysis and are included in leaderboards by default."
  },
  {
    question: "How do you judge if a rep is correct?",
    answer: "Our AI analyzes 33 key body landmarks in real-time, tracking joint angles and movement patterns. For squats: hip crease below knee level, knees tracking over toes. For push-ups: chest to ground, straight body line. For planks: straight body line, engaged core. Each rep gets a 0-100% score based on form accuracy, range of motion, and control."
  },
  {
    question: "What exercises are supported?",
    answer: "Currently, we support squats, push-ups, planks, and several other bodyweight exercises. We&apos;re constantly adding new exercises based on user feedback and demand."
  },
  {
    question: "Do I need special equipment?",
    answer: "No special equipment needed! Just a device with a camera (smartphone, tablet, or computer) and enough space to perform your exercises. The AI works with any standard camera."
  },
  {
    question: "Is my workout data private?",
    answer: "Absolutely. All video processing happens on your device using MediaPipe technology - your video never leaves your device. Only numerical summaries like 'completed 12 squats with 85% form score' are stored on our servers."
  },
  {
    question: "How do I set up my camera for best results?",
    answer: "For squats and push-ups: position your device 6-8 feet away at hip height, showing your full body in profile. For planks: position directly in front at chest height. Ensure even lighting without harsh shadows and avoid backlighting."
  },
  {
    question: "Can I use this offline?",
    answer: "The AI form coaching requires an internet connection for real-time analysis. However, you can view your workout history and some features offline once they&apos;re cached on your device."
  },
  {
    question: "What&apos;s included in the free plan?",
    answer: "The free plan includes basic AI form coaching for supported exercises, workout tracking, and access to your workout history. Premium features include advanced analytics, custom workout plans, and nutrition tracking."
  },
  {
    question: "How accurate is the AI feedback?",
    answer: "Our AI has been trained on thousands of hours of exercise data and achieves over 95% accuracy in form analysis. However, it&apos;s designed to complement, not replace, professional fitness guidance."
  },
  {
    question: "What are the different scoring metrics?",
    answer: "Quality Score: 0-100% for each rep based on form accuracy. Correct Rate: percentage of reps scoring above 70%. Integrity Score: how consistently you maintain good form throughout the session. Volume: total reps multiplied by average quality score."
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
                Got Questions? We&apos;ve Got Answers
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Find answers to the most common questions about AI Form Coach and how it can help transform your fitness journey.
              </p>
            </div>
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
                  Can&apos;t find what you&apos;re looking for? We&apos;re here to help!
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
