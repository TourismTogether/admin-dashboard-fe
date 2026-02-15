import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { Loader2, Mail, Save } from "lucide-react";

interface PersonalTaskEmailSettings {
  sendPersonalTasksEmail: boolean;
  email: string | null;
}

const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [sendEmail, setSendEmail] = useState(false);
  const [email, setEmail] = useState("");

  // Fetch current settings
  const { data: settingsData, isLoading } = useQuery<{
    data: PersonalTaskEmailSettings;
  }>({
    queryKey: ["settings", "personal-tasks-email"],
    queryFn: async () => {
      const response = await apiRequest("/api/settings/personal-tasks-email");
      if (!response.ok) throw new Error("Failed to fetch settings");
      return response.json();
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: {
      sendPersonalTasksEmail: boolean;
      email: string;
    }) => {
      const response = await apiRequest("/api/settings/personal-tasks-email", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update settings");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update settings");
    },
  });

  // Sync state from fetched data
  useEffect(() => {
    if (settingsData?.data) {
      setSendEmail(settingsData.data.sendPersonalTasksEmail);
      setEmail(settingsData.data.email || "");
    }
  }, [settingsData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    updateSettingsMutation.mutate({
      sendPersonalTasksEmail: sendEmail,
      email: email.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your application preferences
        </p>
      </div>

      {/* Email feature temporarily disabled (incomplete / has bugs) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Weekly Personal Task Email
          </CardTitle>
          <CardDescription>
            This feature is temporarily disabled (incomplete). It will be re-enabled in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Receive a weekly summary of your personal tasks via email. Coming back soon.
          </p>
          {/* Original form commented out until email feature is fixed
          <form onSubmit={handleSubmit} className="space-y-6">
            ...
          </form>
          */}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
