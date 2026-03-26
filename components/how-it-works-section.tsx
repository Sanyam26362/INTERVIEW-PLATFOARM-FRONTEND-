import { Target, MessageSquare, FileText } from "lucide-react";

const steps = [
  {
    icon: Target,
    step: "01",
    title: "Choose Domain",
    description: "Select your interview type: SDE, HR, Finance, Marketing, Data Analyst, or Product.",
  },
  {
    icon: MessageSquare,
    step: "02",
    title: "Talk to AI",
    description: "Have a real-time conversation with our AI interviewer in your preferred language.",
  },
  {
    icon: FileText,
    step: "03",
    title: "Get Your Report",
    description: "Receive detailed feedback with scores, improvement areas, and personalized tips.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">
            How it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started with your interview practice in just three simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection Line */}
          <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {steps.map((item, index) => (
            <div key={item.title} className="relative text-center">
              <div className="relative inline-flex flex-col items-center">
                {/* Step Number */}
                <div className="w-16 h-16 rounded-full border-2 border-primary/30 bg-background flex items-center justify-center mb-6 relative z-10">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>

                {/* Step Badge */}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {index + 1}
                </div>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-3">
                {item.title}
              </h3>

              <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
