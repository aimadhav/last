
import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Whiteboard } from "@/components/whiteboard/Whiteboard";
import { ThemeProvider } from "@/hooks/use-theme";

const Index = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");

  useEffect(() => {
    if (projectId) {
      document.title = `Collaborative Whiteboard - Project ${projectId}`;
    } else {
      document.title = "Whiteboard";
    }
  }, [projectId]);

  return (
    <ThemeProvider defaultTheme="light">
      <Whiteboard />
    </ThemeProvider>
  );
};

export default Index;
