'use client'

import { Editor as MonacoEditor } from '@monaco-editor/react';
import { Button } from './ui/button';


export default function Editor() {
    return (
        <div className="h-full w-full">
            <div className="w-full p-5 flex justify-end">
                <Button className="color">
                    Run
                </Button>
            </div>
            <MonacoEditor defaultLanguage="javascript" defaultValue="// some comment" />
        </div>
    )
}