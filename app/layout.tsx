import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

/**
 * @constant metadata
 * @description Metadata for the application, used for SEO and browser tabs.
 * @property {string} title - The title of the application.
 * @property {string} description - A brief description of the application.
 */
export const metadata: Metadata = {
  title: "Fantasy.Comet2",
  description: "Control your Constelia software through the Web API",
}

/**
 * @function RootLayout
 * @description The root layout component for the Next.js application.
 * Wraps the entire application with necessary providers like `ThemeProvider` and `Toaster`.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be rendered within the layout.
 * @returns {JSX.Element} The root HTML structure of the application.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        {/* Provides theme context to the application */}
        <ThemeProvider>
          {children}
          {/* Component to display toast notifications */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
