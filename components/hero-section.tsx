import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/50 text-sm text-muted-foreground mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              AI-Powered Interview Practice
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight text-balance">
              Practice Interviews in{" "}
              <span className="text-primary">Your Language</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              AI-powered mock interviews in Hindi, Tamil, Telugu, English and 6 more languages. Get evaluated instantly.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/dashboard">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8 py-6 w-full sm:w-auto">
                  Start Free Interview
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary text-base px-8 py-6 w-full sm:w-auto"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-8 justify-center lg:justify-start">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">50K+</p>
                <p className="text-sm text-muted-foreground">Interviews</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">10+</p>
                <p className="text-sm text-muted-foreground">Languages</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">95%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </div>

          {/* Right - Floating Mock Interview Card */}
          <div className="relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Card */}
              <div className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-6 shadow-2xl">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-semibold">AI</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Mock Interview</p>
                      <p className="text-xs text-muted-foreground">SDE - Technical Round</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs text-muted-foreground">Recording</span>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                      <span className="text-xs text-primary font-medium">AI</span>
                    </div>
                    <div className="flex-1 rounded-lg bg-secondary/50 p-3">
                      <p className="text-sm text-foreground">
                        {"Tell me about a challenging project you worked on."}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <div className="flex-1 rounded-lg bg-primary/20 p-3 max-w-[80%]">
                      <p className="text-sm text-foreground">
                        {"I led the development of a real-time analytics dashboard that handled 10M+ events daily..."}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground font-medium">You</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                      <span className="text-xs text-primary font-medium">AI</span>
                    </div>
                    <div className="flex-1 rounded-lg bg-secondary/50 p-3">
                      <p className="text-sm text-foreground">
                        {"Excellent! What technologies did you use? 🎯"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex-1 rounded-lg bg-secondary/30 border border-border px-4 py-3">
                    <p className="text-sm text-muted-foreground">Click to speak...</p>
                  </div>
                  <button className="w-12 h-12 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors">
                    <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V20h4v2H8v-2h4v-4.07z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Floating Score Card */}
              <div className="absolute -bottom-4 -left-4 rounded-xl border border-border bg-card/80 backdrop-blur-xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-green-500">92</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Overall Score</p>
                    <p className="text-xs text-muted-foreground">Communication: Excellent</p>
                  </div>
                </div>
              </div>

              {/* Floating Language Badge */}
              <div className="absolute -top-4 -right-4 rounded-xl border border-border bg-card/80 backdrop-blur-xl px-4 py-2 shadow-xl">
                <p className="text-sm font-medium text-foreground">🌐 हिंदी Mode</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
