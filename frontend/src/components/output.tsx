import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface OutputProps {
    contents: string
}

export default function Output({ contents }: OutputProps) {
    return (
        <ScrollArea className="h-full w-full">
            <ScrollArea className="h-full w-full">
                <pre className="w-max h-max p-3">
                    <code>{contents}</code>
                </pre>
            </ScrollArea>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    )
}
