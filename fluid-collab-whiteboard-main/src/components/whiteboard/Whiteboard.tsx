import React, { useEffect, useRef, useState, MouseEvent, TouchEvent } from "react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { useSearchParams } from "react-router-dom";
import { WhiteboardTools, ToolType } from "./WhiteboardTools";
import { ColorPicker } from "./ColorPicker";
import { TextEditor } from "./TextEditor";
import { StickyNote } from "./StickyNote";
import { ImageElement as ImageElementComponent } from "./ImageElement";
import { CollaborationCursor } from "./CollaborationCursor";
import { CollaborationPanel } from "./CollaborationPanel";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTheme } from "@/hooks/use-theme";
import { collaborationService, CollaborationUser } from "@/services/CollaborationService";
import { Element, Point, PathElement, ShapeElement, TextElement, NoteElement, ImageElement, WhiteboardProject } from "@/types/whiteboard";

export const Whiteboard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [action, setAction] = useState<"none" | "drawing" | "moving" | "erasing">("none");
  const [selectedColor, setSelectedColor] = useState<string>("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [opacity, setOpacity] = useState<number>(1);
  const [history, setHistory] = useState<Element[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [showClearDialog, setShowClearDialog] = useState<boolean>(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState<boolean>(false);
  
  const [projects, setProjects] = useState<WhiteboardProject[]>([]);
  const [currentProject, setCurrentProject] = useState<WhiteboardProject | null>(null);
  const [showProjectDialog, setShowProjectDialog] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>("");
  
  const [collaborationUsers, setCollaborationUsers] = useState<CollaborationUser[]>([]);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  
  const { theme } = useTheme();

  // Check for project ID in URL when component mounts
  useEffect(() => {
    const projectId = searchParams.get("project");
    if (projectId) {
      // Load projects first
      const savedProjects = localStorage.getItem('whiteboard-projects');
      if (savedProjects) {
        try {
          const parsedProjects: WhiteboardProject[] = JSON.parse(savedProjects).map((project: any) => ({
            ...project,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt)
          }));
          
          setProjects(parsedProjects);
          
          // Find project by ID
          const projectToLoad = parsedProjects.find(p => p.id === projectId);
          if (projectToLoad) {
            setCurrentProject(projectToLoad);
            setElements(projectToLoad.elements);
            // Connect to collaboration for this project
            setupCollaboration(projectId);
          } else {
            toast.error("Project not found");
          }
        } catch (e) {
          console.error('Error loading projects from localStorage', e);
          createNewProject('Untitled Whiteboard');
        }
      } else {
        createNewProject('Untitled Whiteboard');
      }
    } else {
      // Regular project loading
      loadProjects();
    }
  }, [searchParams]);

  const loadProjects = () => {
    const savedProjects = localStorage.getItem('whiteboard-projects');
    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects);
        setProjects(parsedProjects.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        })));
        
        if (parsedProjects.length > 0) {
          const mostRecent = parsedProjects.reduce((latest: any, project: any) => {
            return new Date(project.updatedAt) > new Date(latest.updatedAt) ? project : latest;
          }, parsedProjects[0]);
          
          setCurrentProject({
            ...mostRecent,
            createdAt: new Date(mostRecent.createdAt),
            updatedAt: new Date(mostRecent.updatedAt)
          });
          setElements(mostRecent.elements);
        }
      } catch (e) {
        console.error('Error loading projects from localStorage', e);
        createNewProject('Untitled Whiteboard');
      }
    } else {
      createNewProject('Untitled Whiteboard');
    }
  };

  const setupCollaboration = (projectId: string) => {
    if (isConnecting) return;
    setIsConnecting(true);
    
    console.log("Setting up collaboration for project:", projectId);
    
    // Connect to socket server
    collaborationService.connect();
    
    // Set up event listeners
    collaborationService.on("elementAdded", (element) => {
      console.log("Remote element added:", element.id);
      setElements(prev => [...prev, element]);
    });
    
    collaborationService.on("elementUpdated", (element) => {
      console.log("Remote element updated:", element.id);
      setElements(prev => prev.map(el => el.id === element.id ? element : el));
    });
    
    collaborationService.on("elementDeleted", (elementId) => {
      console.log("Remote element deleted:", elementId);
      setElements(prev => prev.filter(el => el.id !== elementId));
    });
    
    collaborationService.on("elementsCleared", () => {
      console.log("Remote elements cleared");
      setElements([]);
    });
    
    collaborationService.on("initialElements", (initialElements) => {
      console.log("Received initial elements:", initialElements.length);
      setElements(initialElements);
    });
    
    collaborationService.on("userJoined", (userId, userName) => {
      toast(`${userName} joined the whiteboard`);
      setCollaborationUsers(collaborationService.getUsers());
    });
    
    collaborationService.on("userLeft", (userId) => {
      const user = collaborationUsers.find(u => u.id === userId);
      if (user) {
        toast(`${user.name} left the whiteboard`);
      }
      setCollaborationUsers(collaborationService.getUsers());
    });
    
    collaborationService.on("cursorMoved", () => {
      setCollaborationUsers(collaborationService.getUsers());
    });
    
    collaborationService.on("connected", () => {
      // Join the room for this project
      collaborationService.joinProject(projectId);
      setCollaborationUsers(collaborationService.getUsers());
      setIsConnecting(false);
      toast.success("Connected to collaboration server");
    });
    
    collaborationService.on("disconnected", () => {
      setCollaborationUsers([]);
      setIsConnecting(false);
      toast.error("Disconnected from collaboration server");
    });
    
    collaborationService.on("error", (error) => {
      console.error("Collaboration error:", error);
      setIsConnecting(false);
      toast.error("Failed to connect to collaboration server");
    });
  };
  
  // Track cursor position for collaboration
  const handleMouseMoveForCursor = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    collaborationService.updateCursorPosition(x, y);
  };
  
  // Disconnect from collaboration when component unmounts
  useEffect(() => {
    return () => {
      collaborationService.disconnect();
    };
  }, []);
  
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('whiteboard-projects', JSON.stringify(projects));
    }
  }, [projects]);
  
  useEffect(() => {
    if (currentProject && elements) {
      updateCurrentProject(elements);
    }
  }, [elements]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = selectedColor;
    context.lineWidth = strokeWidth;
    context.globalAlpha = opacity;
    
    contextRef.current = context;
    
    const handleResize = () => {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempContext = tempCanvas.getContext("2d");
      if (!tempContext) return;
      
      tempContext.drawImage(canvas, 0, 0);
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      if (context) {
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = selectedColor;
        context.lineWidth = strokeWidth;
        context.globalAlpha = opacity;
        
        context.drawImage(tempCanvas, 0, 0);
      }
    };
    
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    
    if (!canvas || !context) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    elements.forEach((element) => {
      if (element.type === "text" || element.type === "note" || element.type === "image") {
        return;
      }
      
      context.strokeStyle = element.color;
      context.lineWidth = element.strokeWidth;
      context.globalAlpha = element.opacity;
      
      context.beginPath();
      
      if (element.type === "path" && element.points.length > 0) {
        context.moveTo(element.points[0].x, element.points[0].y);
        element.points.forEach((point) => {
          context.lineTo(point.x, point.y);
        });
      } else if (["rectangle", "circle", "arrow"].includes(element.type) && "startPoint" in element && "endPoint" in element) {
        if (element.type === "rectangle") {
          context.rect(
            element.startPoint.x,
            element.startPoint.y,
            element.endPoint.x - element.startPoint.x,
            element.endPoint.y - element.startPoint.y
          );
        } else if (element.type === "circle") {
          const centerX = (element.startPoint.x + element.endPoint.x) / 2;
          const centerY = (element.startPoint.y + element.endPoint.y) / 2;
          const radiusX = Math.abs(element.endPoint.x - element.startPoint.x) / 2;
          const radiusY = Math.abs(element.endPoint.y - element.startPoint.y) / 2;
          
          context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        } else if (element.type === "arrow") {
          context.moveTo(element.startPoint.x, element.startPoint.y);
          context.lineTo(element.endPoint.x, element.endPoint.y);
          
          const angle = Math.atan2(
            element.endPoint.y - element.startPoint.y,
            element.endPoint.x - element.startPoint.x
          );
          const headLength = 15;
          
          context.lineTo(
            element.endPoint.x - headLength * Math.cos(angle - Math.PI / 6),
            element.endPoint.y - headLength * Math.sin(angle - Math.PI / 6)
          );
          context.moveTo(element.endPoint.x, element.endPoint.y);
          context.lineTo(
            element.endPoint.x - headLength * Math.cos(angle + Math.PI / 6),
            element.endPoint.y - headLength * Math.sin(angle + Math.PI / 6)
          );
        }
      }
      
      context.stroke();
      context.closePath();
    });
    
    context.strokeStyle = selectedColor;
    context.lineWidth = strokeWidth;
    context.globalAlpha = opacity;
  }, [elements, selectedColor, strokeWidth, opacity]);
  
  const createNewProject = (name: string) => {
    const newProject: WhiteboardProject = {
      id: Date.now().toString(),
      name,
      elements: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setProjects(prev => [...prev, newProject]);
    setCurrentProject(newProject);
    setElements([]);
    setHistory([]);
    setHistoryIndex(-1);
    
    toast.success(`Project "${name}" created`);
    
    // Update URL to include the project ID
    setSearchParams({ project: newProject.id });
    
    // Set up collaboration for this project
    setupCollaboration(newProject.id);
  };
  
  const updateCurrentProject = (updatedElements: Element[]) => {
    if (!currentProject) return;
    
    const updatedProject = {
      ...currentProject,
      elements: updatedElements,
      updatedAt: new Date()
    };
    
    setCurrentProject(updatedProject);
    setProjects(prev => prev.map(p => 
      p.id === currentProject.id ? updatedProject : p
    ));
  };
  
  const switchProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      // Disconnect from current project
      collaborationService.disconnect();
      
      setCurrentProject(project);
      setElements(project.elements);
      setHistory([]);
      setHistoryIndex(-1);
      
      // Update URL to include the new project ID
      setSearchParams({ project: projectId });
      
      // Set up collaboration for the new project
      setupCollaboration(projectId);
      
      toast.success(`Switched to "${project.name}"`);
    }
  };
  
  // Enhance element operations to sync with collaboration service
  
  const addElement = (element: Element) => {
    setElements(prev => [...prev, element]);
    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      return [...newHistory, [...elements, element]];
    });
    setHistoryIndex(prev => prev + 1);
    
    // Broadcast to other collaborators
    if (collaborationService.isConnected()) {
      collaborationService.addElement(element);
    }
  };
  
  const updateElement = (elementId: string, updates: Partial<Element>) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
    
    const updatedElement = elements.find(el => el.id === elementId);
    if (updatedElement && collaborationService.isConnected()) {
      collaborationService.updateElement({ ...updatedElement, ...updates });
    }
  };
  
  const removeElement = (elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    
    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      return [...newHistory, elements.filter(el => el.id !== elementId)];
    });
    setHistoryIndex(prev => prev + 1);
    
    if (collaborationService.isConnected()) {
      collaborationService.deleteElement(elementId);
    }
  };
  
  const startDrawing = (point: Point) => {
    if (activeTool === "select") {
      const element = getElementAtPosition(point);
      if (element) {
        if (element.type === "path" || element.type === "rectangle" || element.type === "circle" || element.type === "arrow") {
          setSelectedElement(element);
          setAction("moving");
        }
      }
      return;
    }
    
    if (activeTool === "eraser") {
      setAction("erasing");
      const elementToErase = getElementAtPosition(point);
      if (elementToErase) {
        removeElement(elementToErase.id);
      }
      return;
    }
    
    if (activeTool === "text") {
      const id = Date.now().toString();
      const newTextElement: TextElement = {
        id,
        type: "text",
        position: point,
        text: "Type here...",
        color: selectedColor,
        strokeWidth,
        opacity,
        width: 250,
        height: 150
      };
      
      addElement(newTextElement);
      return;
    }
    
    if (activeTool === "note") {
      const id = Date.now().toString();
      const newNoteElement: NoteElement = {
        id,
        type: "note",
        position: point,
        text: "New note",
        color: "#ffeb3b",
        strokeWidth,
        opacity,
        width: 200,
        height: 200
      };
      
      addElement(newNoteElement);
      return;
    }
    
    if (activeTool === "image") {
      handleImport();
      return;
    }
    
    setAction("drawing");
    
    const id = Date.now().toString();
    
    if (activeTool === "pen") {
      const newElement: PathElement = {
        id,
        type: "path",
        points: [point],
        color: selectedColor,
        strokeWidth,
        opacity,
      };
      
      setElements(prevElements => [...prevElements, newElement]);
    } else if (["rectangle", "circle", "arrow"].includes(activeTool)) {
      const shapeType = activeTool as "rectangle" | "circle" | "arrow";
      const newElement: ShapeElement = {
        id,
        type: shapeType,
        startPoint: point,
        endPoint: point,
        color: selectedColor,
        strokeWidth,
        opacity,
      };
      
      setElements(prevElements => [...prevElements, newElement]);
    }
  };
  
  const draw = (point: Point) => {
    if (action === "none") return;
    
    if (action === "erasing") {
      const elementToErase = getElementAtPosition(point);
      if (elementToErase) {
        removeElement(elementToErase.id);
      }
      return;
    }
    
    if (action === "drawing") {
      const index = elements.length - 1;
      const element = elements[index];
      
      if (activeTool === "pen" && element.type === "path") {
        setElements((prevElements) => {
          const newElement = {
            ...element,
            points: [...element.points, point],
          };
          return [...prevElements.slice(0, index), newElement];
        });
      } else if (["rectangle", "circle", "arrow"].includes(activeTool) && 
                (element.type === "rectangle" || element.type === "circle" || element.type === "arrow")) {
        setElements((prevElements) => {
          const newElement = {
            ...element,
            endPoint: point,
          };
          return [...prevElements.slice(0, index), newElement];
        });
      }
    } else if (action === "moving" && selectedElement) {
      // Moving logic handled by individual components now
    }
  };
  
  const finishDrawing = () => {
    if (action === "drawing") {
      setHistory((prevHistory) => {
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        return [...newHistory, elements];
      });
      setHistoryIndex((prevIndex) => prevIndex + 1);
    }
    
    setAction("none");
    setSelectedElement(null);
  };
  
  const handleTextChange = (id: string, newText: string) => {
    setElements((prevElements) => 
      prevElements.map((el) => 
        el.id === id ? { ...el, text: newText } : el
      )
    );
    
    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      const updatedElements = elements.map((el) => 
        el.id === id ? { ...el, text: newText } : el
      );
      return [...newHistory, updatedElements];
    });
    setHistoryIndex((prevIndex) => prevIndex + 1);
    
    // Update collaboration
    const element = elements.find(el => el.id === id);
    if (element && collaborationService.isConnected()) {
      collaborationService.updateElement({ ...element, text: newText });
    }
  };
  
  const handleElementDelete = (id: string) => {
    removeElement(id);
    toast("Element deleted");
  };
  
  const handlePositionChange = (id: string, newPosition: Point) => {
    setElements((prevElements) => 
      prevElements.map((el) => 
        el.id === id ? { ...el, position: newPosition } : el
      )
    );
    
    // Update collaboration
    const element = elements.find(el => el.id === id);
    if (element && "position" in element && collaborationService.isConnected()) {
      collaborationService.updateElement({ ...element, position: newPosition });
    }
  };
  
  const handleTextResize = (id: string, width: number, height: number) => {
    setElements((prevElements) => 
      prevElements.map((el) => 
        el.id === id && (el.type === "text" || el.type === "note") ? { ...el, width, height } : el
      )
    );
    
    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      const updatedElements = elements.map((el) => 
        el.id === id && (el.type === "text" || el.type === "note") ? { ...el, width, height } : el
      );
      return [...newHistory, updatedElements];
    });
    setHistoryIndex((prevIndex) => prevIndex + 1);
  };
  
  const handleNoteColorChange = (id: string, newColor: string) => {
    setElements((prevElements) => 
      prevElements.map((el) => 
        el.id === id ? { ...el, color: newColor } : el
      )
    );
    
    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      const updatedElements = elements.map((el) => 
        el.id === id ? { ...el, color: newColor } : el
      );
      return [...newHistory, updatedElements];
    });
    setHistoryIndex((prevIndex) => prevIndex + 1);
  };
  
  const handleImageResize = (id: string, width: number, height: number) => {
    setElements((prevElements) => 
      prevElements.map((el) => 
        el.id === id && el.type === "image" ? { ...el, width, height } : el
      )
    );
    
    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      const updatedElements = elements.map((el) => 
        el.id === id && el.type === "image" ? { ...el, width, height } : el
      );
      return [...newHistory, updatedElements];
    });
    setHistoryIndex((prevIndex) => prevIndex + 1);
  };
  
  const handleImageRotate = (id: string, rotation: number) => {
    setElements((prevElements) => 
      prevElements.map((el) => 
        el.id === id && el.type === "image" ? { ...el, rotation } : el
      )
    );
    
    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      const updatedElements = elements.map((el) => 
        el.id === id && el.type === "image" ? { ...el, rotation } : el
      );
      return [...newHistory, updatedElements];
    });
    setHistoryIndex((prevIndex) => prevIndex + 1);
  };
  
  const getElementAtPosition = (point: Point): Element | null => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      
      if (element.type === "text" || element.type === "note" || element.type === "image") {
        const width = element.type === "image" ? element.width : 
                      (element.type === "text" || element.type === "note") && element.width ? element.width : 200;
        const height = element.type === "image" ? element.height : 
                       (element.type === "text" || element.type === "note") && element.height ? element.height : 200;
                       
        if (point.x >= element.position.x && 
            point.x <= element.position.x + width &&
            point.y >= element.position.y && 
            point.y <= element.position.y + height) {
          return element;
        }
        continue;
      }
      
      if (element.type === "path") {
        for (let j = 0; j < element.points.length - 1; j++) {
          const p1 = element.points[j];
          const p2 = element.points[j + 1];
          const distance = distanceToSegment(point, p1, p2);
          if (distance < 10) return element;
        }
      } else if (element.type === "rectangle" && "startPoint" in element && "endPoint" in element) {
        const minX = Math.min(element.startPoint.x, element.endPoint.x);
        const maxX = Math.max(element.startPoint.x, element.endPoint.x);
        const minY = Math.min(element.startPoint.y, element.endPoint.y);
        const maxY = Math.max(element.startPoint.y, element.endPoint.y);
        
        if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
          return element;
        }
      } else if (element.type === "circle" && "startPoint" in element && "endPoint" in element) {
        const centerX = (element.startPoint.x + element.endPoint.x) / 2;
        const centerY = (element.startPoint.y + element.endPoint.y) / 2;
        const radiusX = Math.abs(element.endPoint.x - element.startPoint.x) / 2;
        const radiusY = Math.abs(element.endPoint.y - element.startPoint.y) / 2;
        
        const normalizedX = (point.x - centerX) / radiusX;
        const normalizedY = (point.y - centerY) / radiusY;
        const distance = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
        
        if (distance <= 1) {
          return element;
        }
      } else if (element.type === "arrow" && "startPoint" in element && "endPoint" in element) {
        const distance = distanceToSegment(point, element.startPoint, element.endPoint);
        if (distance < 10) return element;
      }
    }
    
    return null;
  };
  
  const distanceToSegment = (point: Point, p1: Point, p2: Point): number => {
    const A = point.x - p1.x;
    const B = point.y - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = p1.x;
      yy = p1.y;
    } else if (param > 1) {
      xx = p2.x;
      yy = p2.y;
    } else {
      xx = p1.x + param * C;
      yy = p1.y + param * D;
    }
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
      toast("Undo");
    }
  };
  
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
      toast("Redo");
    }
  };
  
  const handleClear = () => {
    setShowClearDialog(true);
  };
  
  const confirmClear = () => {
    setElements([]);
    setHistory([]);
    setHistoryIndex(-1);
    setShowClearDialog(false);
    
    if (collaborationService.isConnected()) {
      collaborationService.clearElements();
    }
    
    toast("Canvas cleared");
  };
  
  const handleExport = () => {
    if (!canvasRef.current) return;
    
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvasRef.current.width;
    exportCanvas.height = canvasRef.current.height;
    const exportContext = exportCanvas.getContext("2d");
    
    if (!exportContext) return;
    
    exportContext.fillStyle = theme === "dark" ? "#171717" : "#ffffff";
    exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    
    exportContext.drawImage(canvasRef.current, 0, 0);
    
    const renderNonCanvasElements = () => {
      const domElements = document.querySelectorAll('[data-element-id]');
      
      domElements.forEach(element => {
        html2canvas(element as HTMLElement).then(canvas => {
          const elementId = element.getAttribute('data-element-id');
          const foundElement = elements.find(el => el.id === elementId);
          
          if (foundElement) {
            if (foundElement.type === 'image') {
              const imgElement = foundElement as ImageElement;
              exportContext.save();
              exportContext.translate(
                imgElement.position.x + imgElement.width / 2,
                imgElement.position.y + imgElement.height / 2
              );
              exportContext.rotate((imgElement.rotation * Math.PI) / 180);
              exportContext.drawImage(
                canvas,
                -imgElement.width / 2,
                -imgElement.height / 2,
                imgElement.width,
                imgElement.height
              );
              exportContext.restore();
            } else if (foundElement.type === 'text' || foundElement.type === 'note') {
              const positionedElement = foundElement as TextElement | NoteElement;
              exportContext.drawImage(canvas, positionedElement.position.x, positionedElement.position.y);
            }
          }
        });
      });
    };
    
    renderNonCanvasElements();
    
    const link = document.createElement("a");
    link.download = currentProject ? `${currentProject.name}.png` : "whiteboard.png";
    link.href = exportCanvas.toDataURL();
    link.click();
    
    toast("Canvas exported as PNG");
  };
  
  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0
