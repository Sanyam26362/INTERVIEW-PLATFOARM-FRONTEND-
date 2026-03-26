import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-balance">
          Ready to ace your next interview?
        </h2>

        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Join thousands of successful candidates who practiced with InterviewAI and landed their dream jobs.
        </p>

        <div className="mt-10">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-10 py-7"
            >
              Start for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          No credit card required. Start practicing in minutes.
        </p>
      </div>
    </section>
  );
}
