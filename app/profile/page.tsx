import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PersonalInfoTab } from "@/components/profile/personal-info-tab";
import { PreferencesTab } from "@/components/profile/preferences-tab";
import { SubscriptionTab } from "@/components/profile/subscription-tab";
import { User, Settings, CreditCard } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile & Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          <ProfileHeader />

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="w-full bg-secondary/50 border border-white/10 p-1 h-auto flex-wrap">
              <TabsTrigger
                value="personal"
                className="flex-1 min-w-[120px] gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Personal Info</span>
                <span className="sm:hidden">Personal</span>
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="flex-1 min-w-[120px] gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Settings className="w-4 h-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger
                value="subscription"
                className="flex-1 min-w-[120px] gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <CreditCard className="w-4 h-4" />
                Subscription
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-6">
              <PersonalInfoTab />
            </TabsContent>

            <TabsContent value="preferences" className="mt-6">
              <PreferencesTab />
            </TabsContent>

            <TabsContent value="subscription" className="mt-6" id="subscription">
              <SubscriptionTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
