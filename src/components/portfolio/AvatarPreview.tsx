import React from "react";
import { Label } from "@/components/ui/label";
import { generateAvatarUrl } from "./shared/utils";

interface AvatarPreviewProps {
  avatarUrl: string;
  username?: string | null;
  userEmail?: string | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const AvatarPreview: React.FC<AvatarPreviewProps> = ({
  avatarUrl,
  username,
  userEmail,
  size = "md",
  showLabel = true,
}) => {
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-64 h-64",
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = generateAvatarUrl(username || userEmail);
  };

  return (
    <div className="space-y-2">
      {showLabel && <Label>Avatar Preview</Label>}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <img
            key={avatarUrl} // Force re-render when URL changes
            src={avatarUrl}
            alt="Avatar preview"
            className={`${sizeClasses[size]} rounded-full border-4 border-border object-cover shadow-lg`}
            onError={handleError}
          />
        </div>
        {showLabel && (
          <p className="text-sm text-muted-foreground text-center">
            Preview updates in realtime
          </p>
        )}
      </div>
    </div>
  );
};
