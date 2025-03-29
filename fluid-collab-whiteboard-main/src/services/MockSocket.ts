
import { EventEmitter } from "events";
import { Element } from "@/types/whiteboard";

// This is a mock implementation for development purposes
// In production, you would use a real Socket.IO server

class MockSocketClient extends EventEmitter {
  private static instance: MockSocketClient;
  private connected = false;
  private rooms: { [roomId: string]: Set<string> } = {};
  private users: { [userId: string]: { name: string, socketId: string, roomId?: string } } = {};
  private elements: { [roomId: string]: Element[] } = {};

  private constructor() {
    super();
    console.log("Creating mock socket client");
  }

  public static getInstance(): MockSocketClient {
    if (!MockSocketClient.instance) {
      MockSocketClient.instance = new MockSocketClient();
    }
    return MockSocketClient.instance;
  }

  public connect() {
    if (this.connected) return;
    
    this.connected = true;
    setTimeout(() => {
      this.emit("connect");
    }, 500);
  }

  public disconnect() {
    if (!this.connected) return;
    
    this.connected = false;
    this.emit("disconnect");
  }

  public emit(event: string, ...args: any[]): boolean {
    if (event === "join") {
      const [roomId, userId, userName] = args;
      
      if (!this.rooms[roomId]) {
        this.rooms[roomId] = new Set();
        this.elements[roomId] = [];
      }
      
      this.rooms[roomId].add(userId);
      this.users[userId] = { name: userName, socketId: `socket_${userId}`, roomId };
      
      // Notify others in room about new user
      this.rooms[roomId].forEach(uid => {
        if (uid !== userId) {
          // Simulate server-to-client event
          setTimeout(() => {
            super.emit("userJoined", userId, userName);
          }, 100);
        }
      });
      
      // Send initial elements
      setTimeout(() => {
        super.emit("initialElements", this.elements[roomId] || []);
      }, 200);
      
      return true;
    }
    
    if (event === "elementAdded") {
      const [roomId, element] = args;
      
      if (!this.rooms[roomId]) {
        return false;
      }
      
      this.elements[roomId] = [...(this.elements[roomId] || []), element];
      
      // Broadcast to all users in room except sender
      this.rooms[roomId].forEach(uid => {
        if (uid !== element.userId) {
          setTimeout(() => {
            super.emit("elementAdded", element);
          }, 100);
        }
      });
      
      return true;
    }
    
    if (event === "elementUpdated") {
      const [roomId, element] = args;
      
      if (!this.rooms[roomId]) {
        return false;
      }
      
      this.elements[roomId] = (this.elements[roomId] || []).map(el => 
        el.id === element.id ? element : el
      );
      
      // Broadcast to all users in room except sender
      this.rooms[roomId].forEach(uid => {
        if (uid !== element.userId) {
          setTimeout(() => {
            super.emit("elementUpdated", element);
          }, 100);
        }
      });
      
      return true;
    }
    
    if (event === "elementDeleted") {
      const [roomId, elementId] = args;
      
      if (!this.rooms[roomId]) {
        return false;
      }
      
      this.elements[roomId] = (this.elements[roomId] || []).filter(el => 
        el.id !== elementId
      );
      
      // Broadcast to all users in room
      this.rooms[roomId].forEach(() => {
        setTimeout(() => {
          super.emit("elementDeleted", elementId);
        }, 100);
      });
      
      return true;
    }
    
    if (event === "elementsCleared") {
      const [roomId] = args;
      
      if (!this.rooms[roomId]) {
        return false;
      }
      
      this.elements[roomId] = [];
      
      // Broadcast to all users in room
      this.rooms[roomId].forEach(() => {
        setTimeout(() => {
          super.emit("elementsCleared");
        }, 100);
      });
      
      return true;
    }
    
    if (event === "cursorMoved") {
      const [roomId, userId, x, y] = args;
      
      if (!this.rooms[roomId]) {
        return false;
      }
      
      // Broadcast to all users in room except sender
      this.rooms[roomId].forEach(uid => {
        if (uid !== userId) {
          setTimeout(() => {
            super.emit("cursorMoved", userId, x, y);
          }, 50);
        }
      });
      
      return true;
    }
    
    return super.emit(event, ...args);
  }
}

// Mock io function to mimic socket.io-client's io function
export const io = (url: string) => {
  console.log(`Mock connecting to ${url}`);
  const socket = MockSocketClient.getInstance();
  socket.connect();
  return socket;
};
