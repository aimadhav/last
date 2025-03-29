
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Palette } from "lucide-react";

interface ColorButtonProps {
  color: string;
  selectedColor: string;
  onClick: (color: string) => void;
}

const ColorButton = ({ color, selectedColor, onClick }: ColorButtonProps) => {
  return (
    <button
      className={cn(
        "w-6 h-6 rounded-full border transition-all hover:scale-110",
        color === selectedColor && "ring-2 ring-offset-2 ring-offset-background"
      )}
      style={{ backgroundColor: color }}
      onClick={() => onClick(color)}
      aria-label={`Select ${color} color`}
    />
  );
};

interface ColorPickerProps {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
}

export const ColorPicker = ({
  selectedColor,
  setSelectedColor,
  strokeWidth,
  setStrokeWidth,
  opacity,
  setOpacity
}: ColorPickerProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const colors = [
    "#000000", // Black
    "#ffffff", // White
    "#f44336", // Red
    "#ff9800", // Orange
    "#ffeb3b", // Yellow
    "#4caf50", // Green
    "#2196f3", // Blue
    "#9c27b0", // Purple
    "#795548", // Brown
    "#607d8b", // Gray
  ];

  if (isCollapsed) {
    return (
      <div className="fixed right-4 top-4 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="glass"
          style={{ backgroundColor: selectedColor, color: getContrastColor(selectedColor) }}
        >
          <Palette size={18} />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-4 top-4 z-10 glass p-3 rounded-lg animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: selectedColor }} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="h-6 w-6"
          aria-label="Collapse color picker"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {colors.map((color) => (
          <ColorButton
            key={color}
            color={color}
            selectedColor={selectedColor}
            onClick={setSelectedColor}
          />
        ))}
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs font-medium">Thickness</span>
            <span className="text-xs text-muted-foreground">{strokeWidth}px</span>
          </div>
          <Slider
            value={[strokeWidth]}
            min={1}
            max={20}
            step={1}
            onValueChange={(value) => setStrokeWidth(value[0])}
            aria-label="Adjust stroke width"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs font-medium">Opacity</span>
            <span className="text-xs text-muted-foreground">{Math.round(opacity * 100)}%</span>
          </div>
          <Slider
            value={[opacity * 100]}
            min={10}
            max={100}
            step={5}
            onValueChange={(value) => setOpacity(value[0] / 100)}
            aria-label="Adjust opacity"
          />
        </div>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center justify-center w-full h-8 mt-3 text-xs font-medium rounded-md hover:bg-secondary border">
            Custom Color
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-2">
            <p className="text-sm font-medium">Choose a custom color</p>
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full h-8 cursor-pointer"
              aria-label="Select custom color"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Helper function to determine if text should be white or black based on background color
function getContrastColor(hexColor: string): string {
  // Convert hex color to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate luminance (perceived brightness)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? "#000000" : "#ffffff";
}
