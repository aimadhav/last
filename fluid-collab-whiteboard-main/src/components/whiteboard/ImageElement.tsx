
import React, { useState, useRef } from "react";
import { Trash, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageElementProps {
  id: string;
  position: { x: number; y: number };
  src: string;
  width: number;
  height: number;
  rotation: number;
  onDelete: (id: string) => void;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onResize: (id: string, width: number, height: number) => void;
  onRotate: (id: string, rotation: number) => void;
}

export const ImageElement = ({
  id,
  position,
  src,
  width,
  height,
  rotation,
  onDelete,
  onPositionChange,
  onResize,
  onRotate,
}: ImageElementProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartDims, setResizeStartDims] = useState({ width, height });
  const [showControls, setShowControls] = useState(false);
  const [resizeMode, setResizeMode] = useState<"free" | "proportional">("proportional");
  
  const imageRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isResizing) {
      setIsDragging(true);
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      e.stopPropagation();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !isResizing) {
      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      };
      onPositionChange(id, newPosition);
      e.stopPropagation();
    } else if (isResizing) {
      const dx = e.clientX - resizeStartPos.x;
      const dy = e.clientY - resizeStartPos.y;
      
      if (resizeMode === "proportional") {
        // Calculate new dimensions while maintaining aspect ratio
        const aspectRatio = resizeStartDims.width / resizeStartDims.height;
        let newWidth = Math.max(50, resizeStartDims.width + dx);
        let newHeight = newWidth / aspectRatio;
        
        onResize(id, newWidth, newHeight);
      } else {
        // Free resizing
        const newWidth = Math.max(50, resizeStartDims.width + dx);
        const newHeight = Math.max(50, resizeStartDims.height + dy);
        
        onResize(id, newWidth, newHeight);
      }
      
      e.stopPropagation();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const startResize = (e: React.MouseEvent, mode: "free" | "proportional" = "proportional") => {
    setIsResizing(true);
    setResizeMode(mode);
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    setResizeStartDims({ width, height });
    e.stopPropagation();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };
  
  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRotate(id, rotation + 90);
  };

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${width}px`,
    height: `${height}px`,
    transform: `rotate(${rotation}deg)`,
    cursor: isDragging ? "grabbing" : "grab",
    zIndex: isDragging || isResizing || showControls ? 100 : 5,
    transition: "box-shadow 0.2s ease",
    boxShadow: showControls ? "0 0 0 2px rgba(63, 131, 248, 0.6)" : "0 2px 8px rgba(0, 0, 0, 0.15)",
  };

  return (
    <div
      ref={imageRef}
      className="relative rounded-lg overflow-hidden"
      style={style}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      data-element-id={id}
    >
      <img 
        src={src} 
        alt="Uploaded content" 
        className="w-full h-full object-contain"
        draggable={false}
      />
      
      {showControls && (
        <div className="absolute top-2 right-2 flex gap-1 bg-background/80 backdrop-blur-sm rounded-md p-1 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRotate}
            title="Rotate 90°"
          >
            <RotateCw size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={handleDelete}
            title="Delete image"
          >
            <Trash size={14} />
          </Button>
        </div>
      )}
      
      {showControls && (
        <>
          {/* Resize corner handle */}
          <div
            className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize bg-primary/80 hover:bg-primary/90 rounded-tl-md flex items-center justify-center transition-colors"
            onMouseDown={(e) => startResize(e, "proportional")}
            title="Resize (maintain aspect ratio)"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path
                fill="currentColor"
                d="M0 0h2v2H0V0zm4 0h2v2H4V0zm4 0h2v2H8V0zm-8 4h2v2H0V4zm4 0h2v2H4V4zm4 0h2v2H8V4zm-8 4h2v2H0V8zm4 0h2v2H4V8zm4 0h2v2H8V8z"
              />
            </svg>
          </div>
          
          {/* Free resize handle */}
          <div
            className="absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize bg-primary/60 hover:bg-primary/80 rounded-tr-md flex items-center justify-center transition-colors"
            onMouseDown={(e) => startResize(e, "free")}
            title="Free resize"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path
                fill="currentColor"
                d="M8 0h2v2H8V0zM4 0h2v2H4V0zM0 0h2v2H0V0zM8 4h2v2H8V4zM4 4h2v2H4V4zM0 4h2v2H0V4zM8 8h2v2H8V8zM4 8h2v2H4V8zM0 8h2v2H0V8z"
              />
            </svg>
          </div>
        </>
      )}
    </div>
  );
};
