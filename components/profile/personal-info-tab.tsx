"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export function PersonalInfoTab() {
  const { user, isLoaded } = useUser();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
        phone: (user.unsafeMetadata?.phone as string) || "",
      });
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log("Saving personal info:", formData);
  };

  if (!isLoaded) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-6 flex justify-center items-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Personal Information</h2>
      
      <div className="grid gap-6 max-w-xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className="bg-secondary/50 border-white/10 focus:border-primary"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className="bg-secondary/50 border-white/10 focus:border-primary"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            disabled
            className="bg-secondary/30 border-white/10 text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            Email is managed by your authentication provider and cannot be changed here.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+91 98765 43210"
            className="bg-secondary/50 border-white/10 focus:border-primary"
          />
        </div>
        
        <div className="pt-4">
          <Button 
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Card>
  );
}
