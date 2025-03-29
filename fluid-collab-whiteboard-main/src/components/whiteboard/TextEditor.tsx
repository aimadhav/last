
import React, { useState, useRef } from "react";
import { Trash } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface TextEditorProps {
  id: string;
  initialText?: string;
  position: { x: number; y: number };
  color: string;
  width?: number;
  height?: number;
  onTextChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onResize?: (id: string, width: number, height: number) => void;
}

export const TextEditor = ({
  id,
  initialText = "Type here...",
  position,
  color,
  width = 250,
  height = 150,
  onTextChange,
  onDelete,
  onPositionChange,
  onResize,
}: TextEditorProps) => {
  const [text, setText] = useState(initialText);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [textWidth, setTextWidth] = useState(width);
  const [textHeight, setTextHeight] = useState(height);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const editorRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing && !isResizing) {
      setIsDragging(true);
      if (editorRef.current) {
        const rect = editorRef.current.getBoundingClientRect();
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      e.stopPropagation();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      };
      onPositionChange(id, newPosition);
      e.stopPropagation();
    } else if (isResizing) {
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;
      
      const newWidth = Math.max(150, resizeStart.width + dx);
      const newHeight = Math.max(100, resizeStart.height + dy);
      
      setTextWidth(newWidth);
      setTextHeight(newHeight);
      
      if (onResize) {
        onResize(id, newWidth, newHeight);
      }
      
      e.stopPropagation();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleClick = () => {
    setIsEditing(true);
    
    // Clear placeholder text when clicked for the first time
    if (text === "Type here...") {
      setText("");
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    // If text is empty, restore placeholder
    if (text === "") {
      setText("Type here...");
    } else {
      onTextChange(id, text);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleDelete = () => {
    onDelete(id);
  };
  
  const startResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: textWidth,
      height: textHeight
    });
  };

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${textWidth}px`,
    height: `${textHeight}px`,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    border: `1px solid ${color}`,
    backdropFilter: "blur(8px)",
    cursor: isDragging ? "grabbing" : isEditing ? "text" : "grab",
    zIndex: isEditing ? 1000 : 5,
  };

  return (
    <div
      ref={editorRef}
      className="rounded-lg p-3 shadow-sm glass flex flex-col"
      style={style}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
    >
      <div className="flex justify-end mb-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-50 hover:opacity-100 hover:bg-black/10"
          onClick={handleDelete}
        >
          <Trash size={14} />
        </Button>
      </div>
      
      {isEditing ? (
        <Textarea
          value={text}
          onChange={handleTextChange}
          onBlur={handleBlur}
          autoFocus
          className="flex-1 resize-none border-none focus-visible:ring-0 bg-transparent"
          placeholder="Type here..."
          style={{ color }}
        />
      ) : (
        <div 
          className="flex-1 overflow-auto whitespace-pre-wrap"
          style={{ color }}
        >
          {text}
        </div>
      )}
      
      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-center justify-center opacity-50 hover:opacity-100"
        onMouseDown={startResize}
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path
            fill="currentColor"
            d="M0 0h2v2H0V0zm4 0h2v2H4V0zm4 0h2v2H8V0zm-8 4h2v2H0V4zm4 0h2v2H4V4zm4 0h2v2H8V4zm-8 4h2v2H0V8zm4 0h2v2H4V8zm4 0h2v2H8V8z"
          />
        </svg>
      </div>
    </div>
  );
};
