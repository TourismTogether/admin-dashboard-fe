import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReadmeCardProps {
  readme: string | null | undefined;
  isEditing: boolean;
  value: string;
  onChange: (value: string) => void;
}

export const ReadmeCard: React.FC<ReadmeCardProps> = ({
  readme,
  isEditing,
  value,
  onChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>README</CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            placeholder="Write your README in Markdown..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={20}
            className="font-mono text-sm"
          />
        ) : readme ? (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-strong:font-semibold prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:text-foreground prose-li:my-2 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-img:rounded-lg prose-img:border prose-img:border-border prose-hr:border-border">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {readme}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            <p>No README yet. Click "Edit Profile" to add one.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
