import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { TabType } from "../shared/types";

interface TaskTabsProps {
  activeTab: TabType;
  incompleteCount: number;
  doneCount: number;
  onTabChange: (tab: TabType) => void;
}

export const TaskTabs: React.FC<TaskTabsProps> = ({
  activeTab,
  incompleteCount,
  doneCount,
  onTabChange,
}) => {
  const incompleteRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const kanbanRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const updateIndicator = () => {
      let activeRef: React.RefObject<HTMLButtonElement | null> | null = null;
      switch (activeTab) {
        case "incomplete":
          activeRef = incompleteRef;
          break;
        case "done":
          activeRef = doneRef;
          break;
        case "kanban":
          activeRef = kanbanRef;
          break;
        default:
          activeRef = incompleteRef;
      }

      if (activeRef?.current) {
        const { offsetLeft, offsetWidth } = activeRef.current;
        setIndicatorStyle({
          left: offsetLeft,
          width: offsetWidth,
        });
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab]);

  return (
    <div className="border-b relative">
      <div className="flex gap-2 relative">
        {/* Sliding indicator */}
        <div
          className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-in-out rounded-full"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />
        
        <button
          ref={incompleteRef}
          onClick={() => onTabChange("incomplete")}
          className={cn(
            "relative px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out",
            "transform hover:scale-105 hover:-translate-y-0.5 z-10",
            "border-b-2 border-transparent",
            activeTab === "incomplete"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="relative z-10">Incomplete ({incompleteCount})</span>
        </button>
        <button
          ref={doneRef}
          onClick={() => onTabChange("done")}
          className={cn(
            "relative px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out",
            "transform hover:scale-105 hover:-translate-y-0.5 z-10",
            "border-b-2 border-transparent",
            activeTab === "done"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="relative z-10">Done ({doneCount})</span>
        </button>
        <button
          ref={kanbanRef}
          onClick={() => onTabChange("kanban")}
          className={cn(
            "relative px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out",
            "transform hover:scale-105 hover:-translate-y-0.5 z-10",
            "border-b-2 border-transparent",
            activeTab === "kanban"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="relative z-10">Kanban</span>
        </button>
      </div>
    </div>
  );
};
