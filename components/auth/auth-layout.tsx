"use client"

import { Mic, BarChart3, Briefcase, Code, Users, TrendingUp } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed] via-[#5b21b6] to-[#1e1b4b]" />
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">InterviewAI</span>
          </div>

          {/* Quote Section */}
          <div className="space-y-8">
            <blockquote className="text-3xl xl:text-4xl font-medium text-white leading-tight">
              &ldquo;The best way to prepare is to practice like it&apos;s real&rdquo;
            </blockquote>
            
            {/* Stats Pills */}
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <span className="text-sm text-white/90">10,000+ interviews conducted</span>
              </div>
              <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <span className="text-sm text-white/90">9 languages supported</span>
              </div>
              <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <span className="text-sm text-white/90">4.8 average rating</span>
              </div>
            </div>
          </div>

          {/* Domain Icons */}
          <div className="space-y-4">
            <p className="text-sm text-white/60">Supported domains</p>
            <div className="flex gap-4">
              {[
                { icon: Code, label: "SDE" },
                { icon: Users, label: "HR" },
                { icon: BarChart3, label: "Data" },
                { icon: TrendingUp, label: "Finance" },
                { icon: Briefcase, label: "Product" },
              ].map((domain) => (
                <div
                  key={domain.label}
                  className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group hover:bg-white/20 transition-colors"
                  title={domain.label}
                >
                  <domain.icon className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
