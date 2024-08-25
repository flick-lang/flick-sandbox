import type { Metadata } from "next"
import { Inter as FontSans } from "next/font/google"
import "./globals.css"

import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const fontSans = FontSans({ 
  subsets: ["latin"], 
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Flick Sandbox",
  description: "A website to try out the Flick programming language",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body 
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
