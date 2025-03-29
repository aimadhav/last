
import React from "react";
import { 
  MousePointer, 
  Pencil, 
  Square, 
  Circle, 
  Type, 
  StickyNote, 
  Image, 
  Eraser, 
  ArrowRight, 
  PanelLeftClose, 
  PanelLeftOpen,
  Undo,
  Redo,
  Download,
  Upload,
  Trash
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ThemeToggle";

export type ToolType = 
  | "select" 
  | "pen" 
  | "rectangle" 
  | "circle" 
  | "text" 
  | "note" 
  | "image" 
  | "eraser"
  | "arrow";

interface ToolButtonProps {
  tool: ToolType;
  activeTool: ToolType;
  icon: React.ReactNode;
  onClick: (tool: ToolType) => void;
  tooltip: string;
}

const ToolButton = ({ tool, activeTool, icon, onClick, tooltip }: ToolButtonProps) => {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "tool-button",
              tool === activeTool && "active"
            )}
            onClick={() => onClick(tool)}
            aria-label={tooltip}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface WhiteboardToolsProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClear: () => void;
  onExport: () => void;
  onImport: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export const WhiteboardTools = ({
  activeTool,
  setActiveTool,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClear,
  onExport,
  onImport,
  isCollapsed,
  toggleCollapse
}: WhiteboardToolsProps) => {
  const tools = [
    { tool: "select" as ToolType, icon: <MousePointer size={18} />, tooltip: "Select" },
    { tool: "pen" as ToolType, icon: <Pencil size={18} />, tooltip: "Pen" },
    { tool: "rectangle" as ToolType, icon: <Square size={18} />, tooltip: "Rectangle" },
    { tool: "circle" as ToolType, icon: <Circle size={18} />, tooltip: "Circle" },
    { tool: "arrow" as ToolType, icon: <ArrowRight size={18} />, tooltip: "Arrow" },
    { tool: "text" as ToolType, icon: <Type size={18} />, tooltip: "Text" },
    { tool: "note" as ToolType, icon: <StickyNote size={18} />, tooltip: "Sticky Note" },
    { tool: "image" as ToolType, icon: <Image size={18} />, tooltip: "Upload Image" },
    { tool: "eraser" as ToolType, icon: <Eraser size={18} />, tooltip: "Eraser" },
  ];

  if (isCollapsed) {
    return (
      <div className="fixed left-2 top-4 z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleCollapse}
                className="glass"
                aria-label="Expand toolbar"
              >
                <PanelLeftOpen size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Expand toolbar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="fixed left-4 top-4 z-10 flex flex-col items-center gap-2 p-2 rounded-lg glass animate-fade-in">
      <div className="flex justify-between w-full mb-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="rounded-full"
                aria-label="Collapse toolbar"
              >
                <PanelLeftClose size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Collapse toolbar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <ThemeToggle />
      </div>
      
      {tools.map((item) => (
        <ToolButton
          key={item.tool}
          tool={item.tool}
          activeTool={activeTool}
          icon={item.icon}
          onClick={setActiveTool}
          tooltip={item.tooltip}
        />
      ))}
      
      <Separator className="my-1" />
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              className="tool-button"
              aria-label="Undo"
            >
              <Undo size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Undo</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              className="tool-button"
              aria-label="Redo"
            >
              <Redo size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Redo</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Separator className="my-1" />
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onExport}
              className="tool-button"
              aria-label="Export"
            >
              <Download size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Export</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onImport}
              className="tool-button"
              aria-label="Import Image"
            >
              <Upload size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Import Image</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="tool-button text-destructive hover:text-destructive"
              aria-label="Clear canvas"
            >
              <Trash size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Clear canvas</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
