
import React, { useState, useRef } from "react";
import { Trash } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface StickyNoteProps {
  id: string;
  initialText?: string;
  position: { x: number; y: number };
  color: string;
  width?: number;
  height?: number;
  onTextChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onColorChange?: (id: string, color: string) => void;
  onResize?: (id: string, width: number, height: number) => void;
}

export const StickyNote = ({
  id,
  initialText = "New note",
  position,
  color,
  width = 200,
  height = 200,
  onTextChange,
  onDelete,
  onPositionChange,
  onColorChange,
  onResize,
}: StickyNoteProps) => {
  const [text, setText] = useState(initialText);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [noteWidth, setNoteWidth] = useState(width);
  const [noteHeight, setNoteHeight] = useState(height);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const noteRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing && !isResizing) {
      setIsDragging(true);
      if (noteRef.current) {
        const rect = noteRef.current.getBoundingClientRect();
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
      const newHeight = Math.max(150, resizeStart.height + dy);
      
      setNoteWidth(newWidth);
      setNoteHeight(newHeight);
      
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

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onTextChange(id, text);
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
      width: noteWidth,
      height: noteHeight
    });
  };

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${noteWidth}px`,
    height: `${noteHeight}px`,
    backgroundColor: color,
    cursor: isDragging ? "grabbing" : isEditing ? "text" : "grab",
    zIndex: isEditing ? 1000 : 10,
  };

  return (
    <div
      ref={noteRef}
      className="rounded-lg p-4 shadow-md flex flex-col"
      style={style}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-1">
          {["#ffeb3b", "#ff9800", "#4caf50", "#2196f3", "#9c27b0"].map((noteColor) => (
            <button
              key={noteColor}
              className="w-4 h-4 rounded-full border hover:scale-110 transition-transform"
              style={{ backgroundColor: noteColor, borderColor: noteColor === color ? "#000" : "transparent" }}
              onClick={() => onColorChange?.(id, noteColor)}
            />
          ))}
        </div>
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
          placeholder="Type your note here..."
        />
      ) : (
        <div className="flex-1 overflow-auto whitespace-pre-wrap">
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
