
"use client"

import { useState, useEffect, useCallback } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Package, Code, Clock, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SoftwareInfoDialogProps {
  isOpen: boolean
  onClose: () => void
  softwareName: string | null
  apiKey: string
}

interface SoftwareDetails {
  version: string
  name: string
  last_update: number
  elapsed: string
  scripts?: Script[]
  checksum?: {
    windows: string
    linux: string
  }
}

interface Script {
  id: string | number
  name: string
  author: string
  elapsed: string
}

const API_BASE_URL = "https://constelia.ai/api.php"

export function SoftwareInfoDialog({ isOpen, onClose, softwareName, apiKey }: SoftwareInfoDialogProps) {
  const [softwareDetails, setSoftwareDetails] = useState<SoftwareDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleApiRequest = useCallback(async (params: Record<string, string>) => {
    if (!apiKey) return null
    const urlParams = new URLSearchParams({ key: apiKey, ...params })
    const url = `${API_BASE_URL}?${urlParams.toString()}`

    try {
      const res = await fetch(url)
      const responseText = await res.text()
      if (!res.ok) throw new Error(responseText || `HTTP ${res.status}`)
      
      const preMatch = responseText.match(/<pre>([\s\S]*?)<\/pre>/)
      return preMatch ? preMatch[1].trim() : responseText.trim()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      setError(errorMessage)
      toast({ title: "API Error", description: errorMessage, variant: "destructive" })
      return null
    }
  }, [apiKey, toast])

  const fetchSoftwareDetails = useCallback(async () => {
    if (!softwareName) return

    setLoading(true)
    setError(null)
    setSoftwareDetails(null)

    const result = await handleApiRequest({ cmd: "getSoftware", name: softwareName, scripts: "", checksum: "" })

    if (result) {
      try {
        const data = JSON.parse(result)
        if (data.error || data.message) {
          throw new Error(data.error || data.message)
        }
        setSoftwareDetails(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to parse software details."
        setError(errorMessage)
        toast({ title: "Error", description: errorMessage, variant: "destructive" })
      }
    }
    setLoading(false)
  }, [softwareName, apiKey, handleApiRequest, toast])

  useEffect(() => {
    if (isOpen && softwareName) {
      fetchSoftwareDetails()
    }
  }, [isOpen, softwareName, fetchSoftwareDetails])

  const getUpdateStatus = (elapsed: string) => {
    if (elapsed.includes("hour") || elapsed.includes("day")) return { color: "bg-green-600", text: "Recent" }
    if (elapsed.includes("week") || elapsed.includes("month")) return { color: "bg-yellow-600", text: "Moderate" }
    return { color: "bg-red-600", text: "Old" }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-gray-100">
            <Package className="h-6 w-6" />
            {softwareName} Details
          </AlertDialogTitle>
          <AlertDialogDescription>
            View detailed information about {softwareName}, including version, update status, checksums, and associated scripts.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {loading ? (
          <div className="flex items-center justify-center space-x-2 py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="text-gray-400">Loading software details...</span>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-8">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : softwareDetails ? (
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-gray-300">
              <div className="grid grid-cols-2 gap-2">
                <div><strong>Version:</strong> {softwareDetails.version}</div>
                <div className="flex items-center gap-1">
                  <strong>Last Update:</strong> {softwareDetails.elapsed}
                  <Badge className={`${getUpdateStatus(softwareDetails.elapsed).color} text-white text-xs`}>
                    {getUpdateStatus(softwareDetails.elapsed).text}
                  </Badge>
                </div>
                <div><strong>Updated On:</strong> {new Date(softwareDetails.last_update * 1000).toLocaleDateString()}</div>
              </div>

              {softwareDetails.checksum && (
                <div className="space-y-2 border-t border-gray-700 pt-4 mt-4">
                  <h4 className="font-semibold text-gray-100">Checksums</h4>
                  <div><strong>Windows:</strong> <code className="break-all bg-gray-800 p-1 rounded text-xs">{softwareDetails.checksum.windows}</code></div>
                  <div><strong>Linux:</strong> <code className="break-all bg-gray-800 p-1 rounded text-xs">{softwareDetails.checksum.linux}</code></div>
                </div>
              )}

              {softwareDetails.scripts && softwareDetails.scripts.length > 0 && (
                <div className="space-y-2 border-t border-gray-700 pt-4 mt-4">
                  <h4 className="font-semibold text-gray-100 flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Associated Scripts ({softwareDetails.scripts.length})
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                        {softwareDetails.scripts.map((script) => (
                          <li key={script.id} className="text-sm">
                            <strong>{script.name}</strong> by {script.author} (Updated: {script.elapsed})
                          </li>
                        ))}
                      </ul>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : null}
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
