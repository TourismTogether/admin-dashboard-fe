import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import mermaid from "mermaid";
import pako from "pako";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Save,
  ExternalLink,
  AlertTriangle,
  Download,
} from "lucide-react";
import {
  fetchBrainstorms,
  createBrainstorm,
  updateBrainstorm,
  deleteBrainstorm,
  BRAINSTORM_TYPES,
  type BrainstormItem,
} from "@/lib/api/brainstormApi";

const DEFAULT_CONTENT: Record<string, string> = {
  Flowchart: "flowchart LR\n  A[Start] --> B[Process]\n  B --> C[End]",
  ER: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : includes
    CUSTOMER {
        string id
        string name
        string email
    }
    ORDER {
        string id
        date orderDate
        string status
    }
    PRODUCT {
        string id
        string name
        float price
    }
    ORDER_ITEM {
        int quantity
        float price
    }`,
  mindmap: "mindmap\n  Brainstorm\n    Idea 1\n    Idea 2\n    Idea 3",
  Class: "classDiagram\n  class Animal {\n    +String name\n    +move()\n  }",
  Sequence: "sequenceDiagram\n  Alice->>Bob: Hello\n  Bob->>Alice: Hi",
  State: "stateDiagram-v2\n  [*] --> Idle\n  Idle --> Running: start",
  Pie: 'pie title Distribution\n  "A" : 40\n  "B" : 60',
  Kanban: "kanban\n  board\n  todo\n  doing\n  done",
  Git: "gitGraph\n  commit\n  branch dev\n  commit\n  checkout main\n  merge dev",
  Quadrant:
    "quadrantChart\n  title Reach and engagement of campaigns\n  x-axis Low Reach --> High Reach\n  y-axis Low Engagement --> High Engagement\n  quadrant-1 We should expand\n  quadrant-2 Need to promote\n  quadrant-3 Re-evaluate\n  quadrant-4 May be improved\n  Campaign A: [0.3, 0.6]\n  Campaign B: [0.45, 0.23]",
};

function getSvgDimensions(svgString: string): { w: number; h: number } {
  const viewBoxMatch = svgString.match(
    /viewBox\s*=\s*["']?\s*(-?[\d.]+)\s+(-?[\d.]+)\s+([\d.]+)\s+([\d.]+)\s*["']?/
  );
  if (viewBoxMatch) {
    const w = Math.ceil(Number(viewBoxMatch[3]));
    const h = Math.ceil(Number(viewBoxMatch[4]));
    if (w > 0 && h > 0) return { w, h };
  }
  const wMatch = svgString.match(/\bwidth\s*=\s*["']?([\d.]+)/);
  const hMatch = svgString.match(/\bheight\s*=\s*["']?([\d.]+)/);
  if (wMatch && hMatch) {
    const w = Math.ceil(Number(wMatch[1]));
    const h = Math.ceil(Number(hMatch[1]));
    if (w > 0 && h > 0) return { w, h };
  }
  return { w: 800, h: 600 };
}

function ensureSvgHasExplicitSize(
  svgString: string,
  w: number,
  h: number
): string {
  const hasWidth = /\bwidth\s*=/.test(svgString);
  const hasHeight = /\bheight\s*=/.test(svgString);
  if (hasWidth && hasHeight) return svgString;
  return svgString.replace(
    /<svg([^>]*)>/,
    (_, attrs) =>
      `<svg${attrs}${hasWidth ? "" : ` width="${w}"`}${
        hasHeight ? "" : ` height="${h}"`
      }>`
  );
}

function svgToPngDataUrl(svgString: string, scale = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const { w: svgW, h: svgH } = getSvgDimensions(svgString);
    const normalizedSvg = ensureSvgHasExplicitSize(svgString, svgW, svgH);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = svgW * scale;
        canvas.height = svgH * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("Failed to load SVG"));
    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(normalizedSvg)));
  });
}

function MermaidPreview({
  content,
  onRendered,
}: {
  content: string;
  onRendered?: (svg: string) => void;
}) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!content.trim()) {
      setSvg(null);
      setError(null);
      return;
    }
    setError(null);
    let cancelled = false;

    const renderDiagram = async () => {
      const container = document.createElement("div");
      container.className = "mermaid";
      container.textContent = content.trim();
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.visibility = "hidden";
      document.body.appendChild(container);

      try {
        await mermaid.run({ nodes: [container], suppressErrors: false });
        if (cancelled) return;
        const svgEl = container.querySelector("svg");
        if (svgEl) {
          const html = container.innerHTML;
          setSvg(html);
          onRendered?.(html);
        } else {
          setError("Could not render diagram");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Invalid diagram");
          setSvg(null);
        }
      } finally {
        document.body.removeChild(container);
      }
    };

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [content, onRendered]);

  if (error) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
        {error}
      </div>
    );
  }
  if (!content.trim()) {
    return (
      <div className="flex items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50/50 p-8 text-gray-500">
        Enter Mermaid code to preview
      </div>
    );
  }
  if (!svg) {
    return (
      <div className="flex items-center justify-center rounded-md border border-gray-200 bg-gray-50/50 p-8 text-gray-500">
        Rendering…
      </div>
    );
  }
  return (
    <div
      className="rounded-md border border-gray-200 bg-white p-4 overflow-auto min-h-[200px] flex items-center justify-center"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
});

const BrainstormPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<BrainstormItem | null>(null);
  const [name, setName] = useState<string>("");
  const [type, setType] = useState<string>("Flowchart");
  const [content, setContent] = useState<string>(
    DEFAULT_CONTENT.Flowchart ?? ""
  );
  const [deleteConfirmItem, setDeleteConfirmItem] =
    useState<BrainstormItem | null>(null);
  const lastRenderedSvgRef = useRef<string | null>(null);

  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["brainstorm"],
    queryFn: fetchBrainstorms,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: ({
      name,
      type,
      content,
    }: {
      name?: string;
      type: string;
      content: string;
    }) => createBrainstorm(type, content, name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["brainstorm"] });
      setSelected(data);
      setName(data.name);
      setType(data.type);
      setContent(data.content);
      toast.success("Created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      name,
      type,
      content,
    }: {
      id: string;
      name?: string;
      type?: string;
      content?: string;
    }) => updateBrainstorm(id, { name, type, content }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["brainstorm"] });
      setSelected(data);
      setName(data.name);
      setType(data.type);
      setContent(data.content);
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBrainstorm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brainstorm"] });
      setDeleteConfirmItem(null);
      setSelected(null);
      setType("Flowchart");
      setContent(DEFAULT_CONTENT.Flowchart ?? "");
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (selected) {
      setName(selected.name);
      setType(selected.type);
      setContent(selected.content);
    } else {
      setName("");
      setType("Flowchart");
      setContent(DEFAULT_CONTENT.Flowchart ?? "");
    }
  }, [selected]);

  const handleTypeChange = (t: string) => {
    setType(t);
    if (!selected && DEFAULT_CONTENT[t]) {
      setContent(DEFAULT_CONTENT[t]);
    }
  };

  const handleSave = () => {
    if (selected) {
      updateMutation.mutate({
        id: selected.id,
        name: name.trim() || "Untitled",
        type,
        content,
      });
    } else {
      createMutation.mutate({
        name: name.trim() || undefined,
        type,
        content,
      });
    }
  };

  const openInMermaidLive = () => {
    const compressed = pako.deflate(content) as Uint8Array;
    const binary = Array.from(compressed)
      .map((b: number) => String.fromCharCode(b))
      .join("");
    const encoded = btoa(binary);
    window.open(`https://mermaid.live/edit#pako:${encoded}`, "_blank");
  };

  const handleExportPng = useCallback(async () => {
    const svg = lastRenderedSvgRef.current;
    if (!svg) {
      toast.error("No diagram to export. Enter and preview a diagram first.");
      return;
    }
    try {
      const dataUrl = await svgToPngDataUrl(svg);
      const link = document.createElement("a");
      const baseName =
        (name || "brainstorm").trim().replace(/[/\\?*:|"]/g, "_") ||
        "brainstorm";
      link.download = `${baseName}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Exported as PNG");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  }, [name]);

  const handlePreviewRendered = useCallback((svg: string) => {
    lastRenderedSvgRef.current = svg;
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (isError) {
    const msg = error?.message ?? "Unknown error";
    const isNetworkError =
      msg === "Failed to fetch" || msg.includes("NetworkError");
    return (
      <div className="p-6 space-y-3">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-medium">Failed to load: {msg}</p>
          {isNetworkError && (
            <p className="mt-2 text-sm">
              Make sure the API server is running (e.g.{" "}
              <code className="bg-red-100 px-1 rounded">pnpm run dev</code> in{" "}
              <code className="bg-red-100 px-1 rounded">
                admin-dashboard-server
              </code>
              ) and the app is using the correct URL (default:
              http://localhost:8081).
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Brainstorm</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelected(null);
              setName("");
              setType("Flowchart");
              setContent(DEFAULT_CONTENT.Flowchart ?? "");
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPng}
            title="Export diagram as PNG"
          >
            <Download className="w-4 h-4 mr-1" />
            Export PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openInMermaidLive}
            title="Open in Mermaid Live Editor"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Mermaid Live
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">My diagrams</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-gray-500">
                No diagrams yet. Create one.
              </p>
            ) : (
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between gap-2 ${
                        selected?.id === item.id
                          ? "bg-gray-200 font-medium"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <span
                        className="truncate"
                        title={item.name || "Untitled"}
                      >
                        {item.name || "Untitled"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmItem(item);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </Button>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center gap-4">
                <div className="space-y-2 flex-1 min-w-[200px]">
                  <Label>Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Untitled"
                    className="font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={handleTypeChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAINSTORM_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button
                    onClick={handleSave}
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {selected ? "Save" : "Create"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mermaid code</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste or type Mermaid diagram code..."
                  className="min-h-[180px] font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Preview</Label>
                <MermaidPreview
                  content={content}
                  onRendered={handlePreviewRendered}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={!!deleteConfirmItem}
        onOpenChange={(open) => !open && setDeleteConfirmItem(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="space-y-4 pb-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 ring-8 ring-destructive/5">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1 space-y-2 pt-1">
                <DialogTitle className="text-xl font-semibold">
                  Delete diagram
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This diagram will be permanently
                  deleted.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {deleteConfirmItem && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm font-medium">
                {deleteConfirmItem.name || "Untitled"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {deleteConfirmItem.type} –{" "}
                {new Date(deleteConfirmItem.updatedAt).toLocaleDateString()}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmItem(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirmItem && deleteMutation.mutate(deleteConfirmItem.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>Deleting...</>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrainstormPage;
