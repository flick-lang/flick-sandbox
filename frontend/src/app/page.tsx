"use client" // necessary 

import { type editor } from 'monaco-editor';

import Editor from "@/components/editor"
import Sidebar from "@/components/sidebar"
import Output from "@/components/output"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import React, { useEffect, useState, useRef } from "react";


export default function Home() {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
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


  const runCode = () => {
    if (editorRef.current === null) {
      // TODO: Maybe do something here
      return
    }

    if (socket === null) {
      // TODO: Maybe do something here
      return
    }

    if (socket.readyState !== WebSocket.OPEN) {
      // TODO: Maybe do something here
      return
    }

    setOutput("")
    const source = editorRef.current.getValue()
    socket.send(source)
  }


  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen">
      <ResizablePanel defaultSize={20} maxSize={30}>
        <Sidebar />
      </ResizablePanel>
      <ResizableHandle className="w-0.5" />
      <ResizablePanel defaultSize={80}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={75} minSize={30}>
            <Editor editorRef={editorRef} runCode={runCode} />
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
