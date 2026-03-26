"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const domains = [
  "SDE",
  "HR",
  "Data Analyst",
  "Finance",
  "Marketing",
  "Product",
];

const languages = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Marathi",
  "Gujarati",
  "Kannada",
  "Malayalam",
];

export function PreferencesTab() {
  const [preferences, setPreferences] = useState({
    domain: "SDE",
    language: "English",
    mode: "voice",
    emailNotifications: true,
    streakReminders: true,
  });

  const handleSave = () => {
    console.log("Saving preferences:", preferences);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Interview Preferences</h2>
      
      <div className="grid gap-8 max-w-xl">
        <div className="space-y-2">
          <Label>Default Interview Domain</Label>
          <Select
            value={preferences.domain}
            onValueChange={(value) =>
              setPreferences((prev) => ({ ...prev, domain: value }))
            }
          >
            <SelectTrigger className="bg-secondary/50 border-white/10 focus:border-primary">
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent className="bg-secondary border-white/10">
              {domains.map((domain) => (
                <SelectItem key={domain} value={domain}>
                  {domain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Preferred Language</Label>
          <Select
            value={preferences.language}
            onValueChange={(value) =>
              setPreferences((prev) => ({ ...prev, language: value }))
            }
          >
            <SelectTrigger className="bg-secondary/50 border-white/10 focus:border-primary">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent className="bg-secondary border-white/10">
              {languages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Interview Mode</Label>
          <RadioGroup
            value={preferences.mode}
            onValueChange={(value) =>
              setPreferences((prev) => ({ ...prev, mode: value }))
            }
            className="flex flex-col gap-3"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="text" id="text" className="border-white/20 text-primary" />
              <Label htmlFor="text" className="font-normal cursor-pointer">
                Text only
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="voice" id="voice" className="border-white/20 text-primary" />
              <Label htmlFor="voice" className="font-normal cursor-pointer">
                Voice
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="both" id="both" className="border-white/20 text-primary" />
              <Label htmlFor="both" className="font-normal cursor-pointer">
                Both
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <Label className="text-base">Notifications</Label>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-white/5">
            <div>
              <p className="font-medium text-foreground">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Interview reminders and updates</p>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, emailNotifications: checked }))
              }
              className="data-[state=checked]:bg-primary"
            />
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-white/5">
            <div>
              <p className="font-medium text-foreground">Streak Reminders</p>
              <p className="text-sm text-muted-foreground">Daily practice nudges to keep your streak</p>
            </div>
            <Switch
              checked={preferences.streakReminders}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, streakReminders: checked }))
              }
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
        
        <div className="pt-4">
          <Button 
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Save Preferences
          </Button>
        </div>
      </div>
    </Card>
  );
}
