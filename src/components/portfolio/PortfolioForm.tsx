import React from "react";
import { MapPin, Building2, Link as LinkIcon, Twitter, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarPreview } from "./AvatarPreview";
import { AvatarInput } from "./AvatarInput";
import type { PortfolioUpdateData } from "@/lib/api/portfolioApi";

interface PortfolioFormProps {
  formData: PortfolioUpdateData;
  avatarUrl: string;
  userEmail?: string | null;
  isSaving: boolean;
  onFieldChange: (field: keyof PortfolioUpdateData, value: string) => void;
  onAvatarChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const PortfolioForm: React.FC<PortfolioFormProps> = ({
  formData,
  avatarUrl,
  userEmail,
  isSaving,
  onFieldChange,
  onAvatarChange,
  onSave,
  onCancel,
}) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create Portfolio</h1>
        <Button onClick={onCancel} variant="outline">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Preview - At the top */}
          <div className="border-b pb-6">
            <AvatarPreview
              avatarUrl={avatarUrl}
              username={formData.username}
              userEmail={userEmail}
              size="md"
              showLabel={true}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username || ""}
                onChange={(e) => onFieldChange("username", e.target.value)}
              />
            </div>

            {/* Avatar URL with drag & drop */}
            <AvatarInput
              value={formData.avatarUrl || ""}
              onChange={onAvatarChange}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio || ""}
              onChange={(e) => onFieldChange("bio", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  type="text"
                  placeholder="Your location"
                  value={formData.location || ""}
                  onChange={(e) => onFieldChange("location", e.target.value)}
                />
              </div>
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="company"
                  type="text"
                  placeholder="Your company"
                  value={formData.company || ""}
                  onChange={(e) => onFieldChange("company", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="blog">Website</Label>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="blog"
                  type="url"
                  placeholder="https://..."
                  value={formData.blog || ""}
                  onChange={(e) => onFieldChange("blog", e.target.value)}
                />
              </div>
            </div>

            {/* Twitter */}
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter</Label>
              <div className="flex items-center gap-2">
                <Twitter className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="twitter"
                  type="text"
                  placeholder="@username"
                  value={formData.twitterUsername || ""}
                  onChange={(e) => onFieldChange("twitterUsername", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* README */}
          <div className="space-y-2">
            <Label htmlFor="readme">README</Label>
            <Textarea
              id="readme"
              placeholder="Write your README in Markdown..."
              value={formData.readme || ""}
              onChange={(e) => onFieldChange("readme", e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={onCancel} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={onSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Creating..." : "Create Portfolio"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
