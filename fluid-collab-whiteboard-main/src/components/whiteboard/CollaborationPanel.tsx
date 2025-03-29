
import React, { useState } from "react";
import { User, UsersRound, X } from "lucide-react";
import { CollaborationUser, collaborationService } from "@/services/CollaborationService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CollaborationPanelProps {
  users: CollaborationUser[];
  currentProjectId: string | null;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ users, currentProjectId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [userName, setUserName] = useState(collaborationService.getUserName());
  const [shareUrl, setShareUrl] = useState("");
  
  const handleShareWhiteboard = () => {
    if (!currentProjectId) return;
    
    const url = new URL(window.location.href);
    url.searchParams.set("project", currentProjectId);
    setShareUrl(url.toString());
    setIsOpen(true);
  };
  
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
  };
  
  const saveUserName = () => {
    if (userName.trim()) {
      collaborationService.setUserName(userName.trim());
      setIsNameDialogOpen(false);
    }
  };

  const isCollaborating = collaborationService.isConnected();
  const connectedUsers = users.filter(u => u.id !== collaborationService.getUserId());

  return (
    <>
      <div className="fixed top-4 right-4 z-20 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-background/80 backdrop-blur-sm shadow-sm flex items-center gap-2"
            onClick={handleShareWhiteboard}
          >
            <UsersRound size={16} />
            <span>Share</span>
            {connectedUsers.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {connectedUsers.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Whiteboard</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <p className="text-sm text-muted-foreground mb-2">
                Anyone with this link can collaborate on this whiteboard
              </p>
              <Input
                value={shareUrl}
                readOnly
                className="font-mono text-xs"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="px-3"
              onClick={copyShareLink}
            >
              <span className="sr-only">Copy</span>
              Copy
            </Button>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Your Name</h4>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 border rounded-md">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: users.find(u => u.id === collaborationService.getUserId())?.color || '#888' }}
                ></div>
                <span>{collaborationService.getUserName()}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsNameDialogOpen(true)}
              >
                Change
              </Button>
            </div>
          </div>
          
          {connectedUsers.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Collaborators ({connectedUsers.length})</h4>
              <div className="max-h-32 overflow-y-auto">
                {connectedUsers.map(user => (
                  <div 
                    key={user.id} 
                    className="flex items-center gap-2 px-3 py-1 mb-1 border rounded-md"
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }}></div>
                    <span>{user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter className="sm:justify-end mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Your Name</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsNameDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={saveUserName}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
