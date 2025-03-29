
import React from "react";
import { CollaborationUser } from "@/services/CollaborationService";

interface CollaborationCursorProps {
  user: CollaborationUser;
}

export const CollaborationCursor: React.FC<CollaborationCursorProps> = ({ user }) => {
  if (!user.cursorPosition) return null;

  return (
    <div
      className="absolute pointer-events-none z-50 select-none"
      style={{
        left: `${user.cursorPosition.x}px`,
        top: `${user.cursorPosition.y}px`,
        transform: 'translate(0, 0)',
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{ color: user.color }}
      >
        <path
          d="M5.64124 17.8387L5.17773 5.02308L15.315 15.3656L9.2833 15.8742L5.64124 17.8387Z"
          fill="currentColor"
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
      <div
        className="ml-4 px-2 py-1 rounded text-xs text-white shadow-sm whitespace-nowrap"
        style={{ backgroundColor: user.color }}
      >
        {user.name}
      </div>
    </div>
  );
};
