"use client" 

import type { editor } from 'monaco-editor';
import type { InferGetStaticPropsType, GetStaticProps } from 'next'

import { toast } from "sonner"

import Editor from "@/components/editor"
import Sidebar from "@/components/sidebar"
import Output from "@/components/output"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import React, { useEffect, useState, useRef } from "react";


type ResolveRejectTuple = [(value: FlickResponse) => void, (reason: FlickResponse) => void];

type FlickResponse = {
  stage: "compiling" | "running",
  description: string,
  status: "started" | "in_progress" | "success" | "error",
  output: string | null,
}


export default function Home() {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [output, setOutput] = useState("")

  // promises["compiling"] and promises["running"] are promises used to resolve the toast
  // 
  // Note: we don't need useState() here, since we don't need React to watch for changes to this record.
  // This is because the record is changed only when a new toast is generated, which will itself cause
  // React to re-render / because the record is not something that gets rendered to the user.
  const promises: Record<string, ResolveRejectTuple> = {}
  
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/compiler")
    setSocket(ws)

    ws.onmessage = (event) => {
      const response: FlickResponse = JSON.parse(event.data)

      switch (response.status) {
        case "started":
          const promise: Promise<FlickResponse> = new Promise((resolve, reject) => {
            promises[response.stage] = [resolve, reject]
          })

          toast.promise(promise, {
            loading: response.description,
            success: (data: FlickResponse) => {
              return data.description;
            },
            error: (data: FlickResponse) => {
              return data.description;
            },
          })

          setOutput("")

          break
        case "in_progress":
          setOutput((prev) => prev + response.output ?? "")
          break
        case "success":
          promises[response.stage][0](response)
          break
        case "error":
          promises[response.stage][1](response)
          break
      }

    }

    ws.onerror = (event) => {
      toast.error("WebSocket error")
    }

    return () => {
      ws.close()
    }
  }, [])


  const runCode = () => {
    if (socket === null) {
      toast.error("WebSocket is not initialized")
      return
    }

    if (socket.readyState !== WebSocket.OPEN) {
      toast.error("WebSocket connection is not open")
      return
    }

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
