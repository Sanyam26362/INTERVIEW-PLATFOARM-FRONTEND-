"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export function ProfileHeader() {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) {
    return <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-6 h-[148px] animate-pulse rounded-xl" />;
  }

  const joinDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) 
    : "Recently";

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-6">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center overflow-hidden">
          <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
        </div>
        
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-foreground">{user.fullName || "User"}</h1>
          <p className="text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
              Free Plan
            </Badge>
            <Link 
              href="#subscription" 
              className="text-sm text-primary hover:underline"
            >
              Upgrade
            </Link>
            <span className="text-sm text-muted-foreground">
              Member since {joinDate}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
