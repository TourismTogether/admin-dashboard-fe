import React, { useRef, useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AvatarInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  showHelperText?: boolean;
}

export const AvatarInput: React.FC<AvatarInputProps> = ({
  value,
  onChange,
  label = "Avatar URL",
  placeholder = "Paste or drag image URL here...",
  showHelperText = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const text = e.dataTransfer.getData("text/plain");
    if (text && (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("data:"))) {
      onChange(text);
      toast.success("Image URL updated!");
    } else {
      toast.error("Please drop a valid image URL");
    }
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text/plain");
    if (text && (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("data:"))) {
      if (e.currentTarget === inputRef.current) {
        onChange(text);
        toast.success("Image URL pasted!");
      }
    }
  }, [onChange]);

  return (
    <div className="space-y-2">
      {label && <Label htmlFor="avatarUrl">{label}</Label>}
      <div
        className={`relative border-2 border-dashed rounded-lg transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="relative p-2">
          <Input
            ref={inputRef}
            id="avatarUrl"
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            className="pr-10"
          />
          <Upload className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        {showHelperText && (
          <p className="text-xs text-muted-foreground px-2 pb-2">
            Drag & drop image URL or paste it here. Leave empty for auto-generated.
          </p>
        )}
      </div>
    </div>
  );
};
