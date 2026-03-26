import { Mic, BarChart3, Briefcase } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Multilingual AI",
    description:
      "Speaks and evaluates in your preferred language. Get comfortable practicing in Hindi, Tamil, Telugu, or any of our 10 supported languages.",
  },
  {
    icon: BarChart3,
    title: "Instant Evaluation",
    description:
      "Get detailed scores on communication, confidence, and accuracy. Our AI provides real-time feedback to help you improve.",
  },
  {
    icon: Briefcase,
    title: "All Domains",
    description:
      "Whether you're preparing for SDE, HR, Finance, Marketing, Data Analyst, or Product roles — we have you covered.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">
            Everything you need to ace your interview
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI-powered platform provides comprehensive interview preparation tools designed for the modern job seeker.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-border bg-card/30 backdrop-blur-xl p-8 transition-all hover:bg-card/50 hover:border-primary/30"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>

                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
