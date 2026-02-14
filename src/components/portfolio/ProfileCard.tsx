import React from "react";
import { MapPin, Building2, Link as LinkIcon, Twitter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarInput } from "./AvatarInput";
import { generateAvatarUrl } from "./shared/utils";
import type { Portfolio, PortfolioUpdateData } from "@/lib/api/portfolioApi";

interface ProfileCardProps {
  portfolio: Portfolio | null | undefined;
  isEditing: boolean;
  formData: PortfolioUpdateData;
  avatarUrl: string;
  userEmail?: string | null;
  onFieldChange: (field: keyof PortfolioUpdateData, value: string) => void;
  onAvatarChange: (value: string) => void;
  isDragging?: boolean;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  portfolio,
  isEditing,
  formData,
  avatarUrl,
  userEmail,
  onFieldChange,
  onAvatarChange,
  isDragging: _isDragging = false,
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Avatar */}
          <div className="relative w-full">
            {isEditing ? (
              <div className="space-y-2">
                <div className="relative mx-auto w-64 h-64">
                  <img
                    key={avatarUrl} // Force re-render when URL changes
                    src={avatarUrl}
                    alt={formData.username || "User"}
                    className="w-64 h-64 rounded-full border-4 border-background object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = generateAvatarUrl(formData.username || userEmail);
                    }}
                  />
                </div>
                <AvatarInput
                  value={formData.avatarUrl || ""}
                  onChange={onAvatarChange}
                  label=""
                  placeholder="Paste or drag image URL here..."
                  showHelperText={true}
                />
              </div>
            ) : (
              <img
                key={avatarUrl} // Force re-render when URL changes
                src={avatarUrl}
                alt={portfolio?.username || "User"}
                className="w-64 h-64 rounded-full border-4 border-background object-cover mx-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = generateAvatarUrl(portfolio?.username || userEmail);
                }}
              />
            )}
          </div>

          {/* Username */}
          <div className="text-center w-full">
            {isEditing ? (
              <Input
                type="text"
                placeholder="Username"
                value={formData.username || ""}
                onChange={(e) => onFieldChange("username", e.target.value)}
                className="text-2xl font-bold text-center"
              />
            ) : (
              <h2 className="text-2xl font-bold">{portfolio?.username || "No username"}</h2>
            )}
          </div>

          {/* Bio */}
          <div className="w-full">
            {isEditing ? (
              <Textarea
                placeholder="Bio"
                value={formData.bio || ""}
                onChange={(e) => onFieldChange("bio", e.target.value)}
                rows={3}
              />
            ) : (
              <p className="text-center text-muted-foreground">{portfolio?.bio || "No bio"}</p>
            )}
          </div>

          {/* Stats - Commits */}
          <div className="w-full border-t pt-4">
            <div className="flex justify-center items-center gap-2">
              <span className="text-2xl font-bold">{portfolio?.commits || 0}</span>
              <span className="text-muted-foreground">commits</span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="w-full space-y-2 border-t pt-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Location"
                      value={formData.location || ""}
                      onChange={(e) => onFieldChange("location", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Company"
                      value={formData.company || ""}
                      onChange={(e) => onFieldChange("company", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={formData.blog || ""}
                      onChange={(e) => onFieldChange("blog", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Twitter</Label>
                  <div className="flex items-center gap-2">
                    <Twitter className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="@username"
                      value={formData.twitterUsername || ""}
                      onChange={(e) => onFieldChange("twitterUsername", e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {portfolio?.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{portfolio.location}</span>
                  </div>
                )}
                {portfolio?.company && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{portfolio.company}</span>
                  </div>
                )}
                {portfolio?.blog && (
                  <div className="flex items-center gap-2 text-sm">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={portfolio.blog}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {portfolio.blog}
                    </a>
                  </div>
                )}
                {portfolio?.twitterUsername && (
                  <div className="flex items-center gap-2 text-sm">
                    <Twitter className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`https://twitter.com/${portfolio.twitterUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      @{portfolio.twitterUsername}
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
