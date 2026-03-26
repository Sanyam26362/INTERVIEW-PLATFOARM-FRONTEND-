"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";

const freePlanFeatures = [
  "2 interviews per month",
  "Basic evaluation",
  "Text mode only",
];

const proPlanFeatures = [
  "Unlimited interviews",
  "Voice mode enabled",
  "Detailed reports & analytics",
  "All 9 languages supported",
  "Priority AI responses",
  "Download reports as PDF",
];

export function SubscriptionTab() {
  const usedInterviews = 1;
  const totalInterviews = 2;
  const usagePercentage = (usedInterviews / totalInterviews) * 100;

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">Usage This Month</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Interviews used</span>
            <span className="text-foreground font-medium">
              {usedInterviews} of {totalInterviews}
            </span>
          </div>
          <div className="h-3 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Resets on the 1st of each month
          </p>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Free Plan</h3>
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
              Current Plan
            </Badge>
          </div>
          
          <p className="text-2xl font-bold text-foreground mb-6">
            Free
            <span className="text-sm font-normal text-muted-foreground ml-1">
              forever
            </span>
          </p>
          
          <ul className="space-y-3 mb-6">
            {freePlanFeatures.map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          
          <Button 
            variant="outline" 
            className="w-full border-white/10 text-muted-foreground"
            disabled
          >
            Current Plan
          </Button>
        </Card>

        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm border-primary/30 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Pro Plan</h3>
            </div>
            
            <p className="text-2xl font-bold text-foreground mb-6">
              ₹299
              <span className="text-sm font-normal text-muted-foreground ml-1">
                /month
              </span>
            </p>
            
            <ul className="space-y-3 mb-6">
              {proPlanFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-sm text-foreground">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Upgrade to Pro
            </Button>
          </div>
        </Card>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Billing Information</h3>
        <p className="text-sm text-muted-foreground">
          You are currently on the Free plan. Upgrade to Pro to unlock unlimited interviews and premium features.
        </p>
        <div className="mt-4 flex gap-3">
          <Button variant="outline" className="border-white/10 text-foreground hover:bg-secondary/50">
            View Billing History
          </Button>
          <Button variant="outline" className="border-white/10 text-foreground hover:bg-secondary/50">
            Manage Payment Methods
          </Button>
        </div>
      </Card>
    </div>
  );
}
