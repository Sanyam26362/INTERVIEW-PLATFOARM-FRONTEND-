import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { NewInterviewCard } from "@/components/dashboard/new-interview-card";
import { RecentSessions } from "@/components/dashboard/recent-sessions";
import { PerformanceChart } from "@/components/dashboard/performance-chart";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/signin");

  const firstName = user.firstName || "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              {greeting}, {firstName} 👋
            </h1>
            <p className="mt-1 text-muted-foreground">
              Ready for your next interview?
            </p>
          </header>

          <section className="mb-8">
            <StatsCards />
          </section>

          <section id="new" className="mb-8 scroll-mt-8">
            <NewInterviewCard />
          </section>

          <div id="sessions" className="grid gap-8 xl:grid-cols-2 scroll-mt-8">
            <section className="xl:col-span-2 2xl:col-span-1">
              <RecentSessions />
            </section>
            <section className="xl:col-span-2 2xl:col-span-1">
              <PerformanceChart />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
