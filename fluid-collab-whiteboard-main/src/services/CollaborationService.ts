import { io } from "./MockSocket";
import { Element } from "@/types/whiteboard";

// Define event types for type safety
type CollaborationEvents = {
  join: (projectId: string, userId: string, userName: string) => void;
  leave: () => void;
  elementAdded: (element: Element) => void;
  elementUpdated: (element: Element) => void;
  elementDeleted: (elementId: string) => void;
  elementsCleared: () => void;
  userJoined: (userId: string, userName: string) => void;
  userLeft: (userId: string) => void;
  cursorMoved: (userId: string, x: number, y: number) => void;
};

type ServerEvents = {
  userJoined: (userId: string, userName: string) => void;
  userLeft: (userId: string) => void;
  elementAdded: (element: Element) => void;
  elementUpdated: (element: Element) => void;
  elementDeleted: (elementId: string) => void;
  elementsCleared: () => void;
  initialElements: (elements: Element[]) => void;
  cursorMoved: (userId: string, x: number, y: number) => void;
};

export type CollaborationUser = {
  id: string;
  name: string;
  color: string;
  cursorPosition?: { x: number; y: number };
  lastActive: Date;
};

class CollaborationService {
  private socket: Socket | null = null;
  private projectId: string | null = null;
  private userId: string;
  private userName: string;
  private eventHandlers: { [key: string]: Function[] } = {};
  private userColors = [
    "#FF5733", "#33FF57", "#3357FF", "#F033FF", "#FF33F0",
    "#33FFF0", "#F0FF33", "#FF3333", "#33FF33", "#3333FF"
  ];
  
  private users: CollaborationUser[] = [];
  private connected = false;
  private lastCursorUpdate = 0;
  private cursorUpdateInterval = 50; // ms, throttle cursor updates

  constructor() {
    this.userId = this.generateUserId();
    this.userName = `User_${this.userId.slice(0, 5)}`;
  }

  private generateUserId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  public setUserName(name: string) {
    this.userName = name;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getUserName(): string {
    return this.userName;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public getUsers(): CollaborationUser[] {
    return this.users;
  }

  public connect(serverUrl: string = "https://mock-socket-server.com"): void {
    if (this.socket) {
      console.log("Socket already exists, disconnecting first");
      this.disconnect();
    }

    console.log(`Connecting to collaboration server at ${serverUrl}`);
    this.socket = io(serverUrl);

    this.socket.on("connect", () => {
      console.log("Connected to collaboration server");
      this.connected = true;
      this.emit("connected");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from collaboration server");
      this.connected = false;
      this.users = [];
      this.emit("disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      this.emit("error", error);
    });

    // Handle server events
    this.socket.on("userJoined", (userId: string, userName: string) => {
      console.log(`User joined: ${userName} (${userId})`);
      const color = this.userColors[this.users.length % this.userColors.length];
      this.users.push({ 
        id: userId, 
        name: userName, 
        color, 
        lastActive: new Date() 
      });
      this.emit("userJoined", userId, userName);
    });

    this.socket.on("userLeft", (userId: string) => {
      console.log(`User left: ${userId}`);
      this.users = this.users.filter(user => user.id !== userId);
      this.emit("userLeft", userId);
    });

    this.socket.on("elementAdded", (element: Element) => {
      this.emit("elementAdded", element);
    });

    this.socket.on("elementUpdated", (element: Element) => {
      this.emit("elementUpdated", element);
    });

    this.socket.on("elementDeleted", (elementId: string) => {
      this.emit("elementDeleted", elementId);
    });

    this.socket.on("elementsCleared", () => {
      this.emit("elementsCleared");
    });

    this.socket.on("initialElements", (elements: Element[]) => {
      this.emit("initialElements", elements);
    });

    this.socket.on("cursorMoved", (userId: string, x: number, y: number) => {
      const user = this.users.find(u => u.id === userId);
      if (user) {
        user.cursorPosition = { x, y };
        user.lastActive = new Date();
        this.emit("cursorMoved", userId, x, y);
      }
    });
  }

  public joinProject(projectId: string): void {
    if (!this.socket) {
      console.error("Socket not initialized. Call connect() first.");
      return;
    }

    this.projectId = projectId;
    console.log(`Joining project: ${projectId}`);
    this.socket.emit("join", projectId, this.userId, this.userName);
  }

  public disconnect(): void {
    if (this.socket) {
      console.log("Disconnecting from collaboration server");
      this.socket.disconnect();
      this.socket = null;
      this.projectId = null;
      this.connected = false;
      this.users = [];
    }
  }

  public addElement(element: Element): void {
    if (!this.socket || !this.projectId) {
      console.error("Not connected to a project");
      return;
    }

    console.log("Broadcasting element added:", element.id);
    this.socket.emit("elementAdded", this.projectId, element);
  }

  public updateElement(element: Element): void {
    if (!this.socket || !this.projectId) {
      console.error("Not connected to a project");
      return;
    }

    console.log("Broadcasting element updated:", element.id);
    this.socket.emit("elementUpdated", this.projectId, element);
  }

  public deleteElement(elementId: string): void {
    if (!this.socket || !this.projectId) {
      console.error("Not connected to a project");
      return;
    }

    console.log("Broadcasting element deleted:", elementId);
    this.socket.emit("elementDeleted", this.projectId, elementId);
  }

  public clearElements(): void {
    if (!this.socket || !this.projectId) {
      console.error("Not connected to a project");
      return;
    }

    console.log("Broadcasting clear all elements");
    this.socket.emit("elementsCleared", this.projectId);
  }

  public updateCursorPosition(x: number, y: number): void {
    if (!this.socket || !this.projectId) {
      return;
    }

    const now = Date.now();
    if (now - this.lastCursorUpdate < this.cursorUpdateInterval) {
      return; // Throttle updates
    }
    
    this.lastCursorUpdate = now;
    this.socket.emit("cursorMoved", this.projectId, this.userId, x, y);
  }

  public on<T extends keyof ServerEvents>(event: T, handler: ServerEvents[T]): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  public off<T extends keyof ServerEvents>(event: T, handler: ServerEvents[T]): void {
    if (!this.eventHandlers[event]) {
      return;
    }
    this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
  }

  private emit(event: string, ...args: any[]): void {
    if (!this.eventHandlers[event]) {
      return;
    }
    this.eventHandlers[event].forEach(handler => handler(...args));
  }
}

// Export a singleton instance
export const collaborationService = new CollaborationService();
