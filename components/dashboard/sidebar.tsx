"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  Play, 
  List, 
  User, 
  TrendingUp 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard#new", icon: Play, label: "New Interview" },
  { href: "/dashboard#sessions", icon: List, label: "My Sessions" },
  { href: "/analytics", icon: TrendingUp, label: "Analytics" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-border bg-card/50 backdrop-blur-sm">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="text-xl font-bold text-foreground">
          Taiyaari<span className="text-primary">AI</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          // Precise matching for active state, while ignoring hash links for exact pathname match
          const isActive = pathname === item.href || (pathname === "/dashboard" && item.href.startsWith("/dashboard#"));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">Signed in</p>
          </div>
        </div>
      </div>
    </aside>
  );
}