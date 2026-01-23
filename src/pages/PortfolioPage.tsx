import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, MapPin, Building2, Link as LinkIcon, Twitter, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getPortfolio, upsertPortfolio, type Portfolio, type PortfolioUpdateData } from "@/lib/api/portfolioApi";

const PortfolioPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PortfolioUpdateData>({});

  // Fetch portfolio
  const { data: portfolio, isLoading } = useQuery<Portfolio | null>({
    queryKey: ["portfolio"],
    queryFn: getPortfolio,
  });

  // Update portfolio mutation
  const updateMutation = useMutation({
    mutationFn: upsertPortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      setIsEditing(false);
      toast.success("Portfolio updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update portfolio: ${error.message}`);
    },
  });

  const handleEdit = () => {
    if (portfolio) {
      setFormData({
        username: portfolio.username || "",
        bio: portfolio.bio || "",
        avatarUrl: portfolio.avatarUrl || "",
        readme: portfolio.readme || "",
        location: portfolio.location || "",
        company: portfolio.company || "",
        blog: portfolio.blog || "",
        twitterUsername: portfolio.twitterUsername || "",
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof PortfolioUpdateData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading portfolio...</div>
      </div>
    );
  }

  const displayData = isEditing ? formData : portfolio || {};

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header with Edit button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        {!isEditing ? (
          <Button onClick={handleEdit} variant="outline">
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        )}
      </div>

      {!portfolio && !isEditing && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground mb-4">
              No portfolio found. Click "Edit Profile" to create one.
            </div>
            <Button onClick={handleEdit} className="mx-auto">
              Create Portfolio
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Profile Info (GitHub style) */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                {/* Avatar */}
                <div className="relative">
                  {isEditing ? (
                    <div className="w-64 h-64 rounded-full bg-muted flex items-center justify-center">
                      <Input
                        type="text"
                        placeholder="Avatar URL"
                        value={formData.avatarUrl || ""}
                        onChange={(e) => handleChange("avatarUrl", e.target.value)}
                        className="text-center"
                      />
                    </div>
                  ) : (
                    <img
                      src={portfolio?.avatarUrl || "https://via.placeholder.com/256"}
                      alt={portfolio?.username || "User"}
                      className="w-64 h-64 rounded-full border-4 border-background"
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
                      onChange={(e) => handleChange("username", e.target.value)}
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
                      onChange={(e) => handleChange("bio", e.target.value)}
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
                            onChange={(e) => handleChange("location", e.target.value)}
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
                            onChange={(e) => handleChange("company", e.target.value)}
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
                            onChange={(e) => handleChange("blog", e.target.value)}
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
                            onChange={(e) => handleChange("twitterUsername", e.target.value)}
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
        </div>

        {/* Right Content - README */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>README</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  placeholder="Write your README in Markdown..."
                  value={formData.readme || ""}
                  onChange={(e) => handleChange("readme", e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                />
              ) : portfolio?.readme ? (
                <div className="markdown-content">
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-foreground prose-a:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg">
                    <pre className="whitespace-pre-wrap font-sans text-sm bg-muted/50 p-4 rounded-lg overflow-x-auto border">
                      <code>{portfolio.readme}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <p>No README yet. Click "Edit Profile" to add one.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;
