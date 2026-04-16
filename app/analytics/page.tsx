"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { OverviewCards } from "@/components/analytics/overview-cards";
import { ProgressTracker } from "@/components/analytics/progress-tracker";
import { DomainBreakdown } from "@/components/analytics/domain-breakdown";
import { StrengthWeaknessTracker } from "@/components/analytics/strength-weakness-tracker";
import { ReportsTable } from "@/components/analytics/reports-table";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="mt-1 text-muted-foreground">
              Track your progress, identify patterns, and see where to improve
            </p>
          </header>

          <section className="mb-8">
            <OverviewCards />
          </section>

          <div className="mb-8 grid gap-6 xl:grid-cols-2">
            <ProgressTracker />
            <StrengthWeaknessTracker />
          </div>

          <section className="mb-8">
            <DomainBreakdown />
          </section>

          <section>
            <ReportsTable />
          </section>
        </div>
      </main>
    </div>
  );
}
