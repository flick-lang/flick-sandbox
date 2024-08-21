"use client" // necessary 
import Editor from "@/components/editor"
import Sidebar from "@/components/sidebar"
import Output from "@/components/output"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import React, { useEffect, useState } from "react";

// import dynamic from "next/dynamic";
// const Editor = dynamic(() => import("@/components/editor"), {ssr: false})

export default function Home() {
  /** TODO: NEXT UP!!!!!!!!!!!!!!!!!!!!!1

  When Run is clicked, we need to grab editor value 
  https://www.npmjs.com/package/@monaco-editor/react
  */
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [output, setOutput] = useState("")
  
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/compiler")
    setSocket(ws)

    ws.onmessage = (event) => {
      setOutput((prevOutput) => prevOutput + event.data)
    }

    return () => {
      ws.close()
    }
  }, [])


  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen">
      <ResizablePanel defaultSize={20} maxSize={30}>
        <Sidebar />
      </ResizablePanel>
      <ResizableHandle className="w-0.5" />
      <ResizablePanel defaultSize={80}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={75} minSize={30}>
            <Editor />
          </ResizablePanel>
          <ResizableHandle className="h-0.5" />
          {/** TODO: fix the thickness of this handle  */}
          <ResizablePanel defaultSize={25} minSize={10}>
            <Output contents={output} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
