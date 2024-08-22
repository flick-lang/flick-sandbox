import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"



interface OutputProps {
    contents: string;
}


export default function Output({ contents }: OutputProps) {
    return (
        <div className="h-full w-full">
            <ScrollArea className="h-full w-full">
                <ScrollArea className="h-full w-full">
                    <div className="w-max h-max whitespace-pre p-3">
                        {contents}
                    </div>
                    {/* <ScrollBar orientation="vertical" /> */}
                </ScrollArea>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    )
}