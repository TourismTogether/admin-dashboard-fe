import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getPortfolio, upsertPortfolio, deletePortfolio, getContributions, type Portfolio, type PortfolioUpdateData } from "@/lib/api/portfolioApi";
import { useSelector } from "react-redux";
import { selectAuthUser } from "@/store/authSlice";
import {
  DeletePortfolioDialog,
  EmptyState,
  PortfolioForm,
  ProfileCard,
  ReadmeCard,
  ContributionCalendar,
  generateAvatarUrl,
} from "@/components/portfolio";

const PortfolioPage: React.FC = () => {
  const queryClient = useQueryClient();
  const user = useSelector(selectAuthUser);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<PortfolioUpdateData>({});
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // Fetch portfolio
  const { data: portfolio, isLoading } = useQuery<Portfolio | null>({
    queryKey: ["portfolio"],
    queryFn: getPortfolio,
  });

  // Fetch contributions
  const { data: contributions = {} } = useQuery<Record<string, number>>({
    queryKey: ["portfolio", "contributions"],
    queryFn: getContributions,
    enabled: !!portfolio, // Only fetch if portfolio exists
  });

  // Update portfolio mutation
  const updateMutation = useMutation({
    mutationFn: upsertPortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      setIsEditing(false);
      setIsCreating(false);
      setFormData({});
      setAvatarPreview("");
      toast.success("Portfolio saved successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save portfolio: ${error.message}`);
    },
  });

  // Delete portfolio mutation
  const deleteMutation = useMutation({
    mutationFn: deletePortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      toast.success("Portfolio deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete portfolio: ${error.message}`);
    },
  });

  const handleCreate = () => {
    const initialUsername = user?.email?.split("@")[0] || "";
    setFormData({
      username: initialUsername,
      bio: "",
      avatarUrl: "",
      readme: "",
      location: "",
      company: "",
      blog: "",
      twitterUsername: "",
    });
    setAvatarPreview(generateAvatarUrl(initialUsername));
    setIsCreating(true);
  };

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
      setAvatarPreview(portfolio.avatarUrl || generateAvatarUrl(portfolio.username || user?.email));
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setFormData({});
    setAvatarPreview("");
  };

  const handleSave = () => {
    // Auto-generate avatar if not provided
    const dataToSave = { ...formData };
    if (!dataToSave.avatarUrl && dataToSave.username) {
      dataToSave.avatarUrl = generateAvatarUrl(dataToSave.username);
    }
    updateMutation.mutate(dataToSave);
  };

  const handleFieldChange = (field: keyof PortfolioUpdateData, value: string) => {
    // Update formData
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Update avatar preview in realtime
      if (field === "avatarUrl") {
        // If avatarUrl is provided, use it; otherwise generate from username
        if (value && value.trim()) {
          setAvatarPreview(value);
        } else {
          // Clear avatarUrl, generate from username
          setAvatarPreview(generateAvatarUrl(updated.username || user?.email));
        }
      } else if (field === "username") {
        // If no avatarUrl, generate from username
        if (!updated.avatarUrl || !updated.avatarUrl.trim()) {
          setAvatarPreview(generateAvatarUrl(value || user?.email));
        }
        // If avatarUrl exists, keep it (don't regenerate)
      }
      
      return updated;
    });
  };

  const handleAvatarChange = (value: string) => {
    // Update formData and preview immediately for realtime updates
    setFormData((prev) => {
      const updated = { ...prev, avatarUrl: value };
      
      // Update preview immediately
      if (value && value.trim()) {
        setAvatarPreview(value);
      } else {
        // Generate from username if avatarUrl is cleared
        const generated = generateAvatarUrl(prev.username || user?.email);
        setAvatarPreview(generated);
      }
      
      return updated;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading portfolio...</div>
      </div>
    );
  }

  const isFormMode = isEditing || isCreating;
  
  // Determine avatar URL with realtime preview
  const getAvatarUrl = () => {
    if (isFormMode) {
      // In form mode, prioritize avatarPreview (realtime updates)
      // then formData.avatarUrl, then generated from username
      if (avatarPreview) {
        return avatarPreview;
      }
      if (formData.avatarUrl && formData.avatarUrl.trim()) {
        return formData.avatarUrl;
      }
      return generateAvatarUrl(formData.username || user?.email);
    }
    // View mode - use portfolio data
    if (portfolio?.avatarUrl) return portfolio.avatarUrl;
    return generateAvatarUrl(portfolio?.username || user?.email);
  };
  
  const avatarUrl = getAvatarUrl();

  // Show create form
  if (!portfolio && isCreating) {
    return (
      <PortfolioForm
        formData={formData}
        avatarUrl={avatarUrl}
        userEmail={user?.email}
        isSaving={updateMutation.isPending}
        onFieldChange={handleFieldChange}
        onAvatarChange={handleAvatarChange}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  // Show empty state
  if (!portfolio && !isCreating) {
    return <EmptyState onCreate={handleCreate} />;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header with Edit/Delete buttons */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        {!isFormMode ? (
          <div className="flex gap-2">
            <Button onClick={handleEdit} variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <DeletePortfolioDialog
              onConfirm={() => deleteMutation.mutate()}
              isLoading={deleteMutation.isPending}
            />
          </div>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Profile Info */}
        <div className="lg:col-span-1">
          <ProfileCard
            portfolio={portfolio}
            isEditing={isFormMode}
            formData={formData}
            avatarUrl={avatarUrl}
            userEmail={user?.email}
            onFieldChange={handleFieldChange}
            onAvatarChange={handleAvatarChange}
          />
        </div>

        {/* Right Content - README */}
        <div className="lg:col-span-2">
          <ReadmeCard
            readme={portfolio?.readme}
            isEditing={isFormMode}
            value={formData.readme || ""}
            onChange={(value) => handleFieldChange("readme", value)}
          />
        </div>
      </div>

      {/* Contribution Calendar - Full Width */}
      {!isFormMode && (
        <div className="mt-6">
          <ContributionCalendar contributions={contributions} />
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
