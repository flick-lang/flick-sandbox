import Editor from "@/components/editor"
import Sidebar from "@/components/sidebar"
import Output from "@/components/output"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

// import dynamic from "next/dynamic";
// const Editor = dynamic(() => import("@/components/editor"), {ssr: false})

export default function Home() {
  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen">
      <ResizablePanel defaultSize={20} maxSize={30}>
        <Sidebar />
      </ResizablePanel>
      <ResizableHandle className="w-0.5"/>
      <ResizablePanel defaultSize={80}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={75} minSize={30}>
            <Editor />
          </ResizablePanel>
          <ResizableHandle className="h-0.5" />   
          {/** TODO: fix the thickness of this handle  */}
          <ResizablePanel defaultSize={25} minSize={10}>
            <Output />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
