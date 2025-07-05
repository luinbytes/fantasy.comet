"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Download, RefreshCw, Clock, Package, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SoftwareInfoDialog } from "./software-info-dialog"

// Define a more precise interface for the Software object.
interface Software {
  version: string
  last_update: number
  elapsed: string
  name: string
}

interface SoftwareDashboardProps {
  apiKey: string
}

const API_BASE_URL = "https://constelia.ai/api.php"

export function SoftwareDashboard({ apiKey }: SoftwareDashboardProps) {
  const [software, setSoftware] = useState<Software[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [selectedSoftwareName, setSelectedSoftwareName] = useState<string | null>(null)

  // Centralized API request handler for consistency.
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

  const fetchSoftware = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await handleApiRequest({ cmd: "getAllSoftware" })
    if (result) {
      try {
        const data = JSON.parse(result)
        if (Array.isArray(data)) {
          setSoftware(data)
        } else if (data.error) {
          setError(data.error)
        } else {
          setError("Unexpected response format for software.")
        }
      } catch {
        setError("Failed to parse software data.")
      }
    }
    setLoading(false)
  }, [handleApiRequest])

  useEffect(() => {
    if (apiKey) {
      fetchSoftware()
    }
  }, [apiKey, fetchSoftware])

  const handleInfoClick = (softwareName: string) => {
    setSelectedSoftwareName(softwareName)
    setIsInfoModalOpen(true)
  }

  const downloadSoftware = (softwareName: string) => {
    if (!apiKey) return
    const url = `${API_BASE_URL}?key=${encodeURIComponent(apiKey)}&cmd=getSolution&software=${encodeURIComponent(softwareName)}`
    window.open(url, "_blank")
  }

  // Memoize software statistics to avoid recalculating on every render.
  const stats = useMemo(() => {
    const recent = software.filter(s => s.elapsed.includes("hour") || s.elapsed.includes("day")).length
    const moderate = software.filter(s => s.elapsed.includes("week") || s.elapsed.includes("month")).length
    const old = software.length - recent - moderate
    return { total: software.length, recent, moderate, old }
  }, [software])

  const getUpdateStatus = (elapsed: string) => {
    if (elapsed.includes("hour") || elapsed.includes("day")) return { color: "bg-green-600", text: "Recent" }
    if (elapsed.includes("week") || elapsed.includes("month")) return { color: "bg-yellow-600", text: "Moderate" }
    return { color: "bg-red-600", text: "Old" }
  }

  if (!apiKey) {
    return <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="text-center text-gray-400"><Package className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Enter your API key to view software</p></div></CardContent></Card>
  }

  if (loading) {
    return <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="flex items-center justify-center space-x-2 text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /><span>Loading software...</span></div></CardContent></Card>
  }

  if (error) {
    return <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><Alert variant="destructive" className="bg-red-950 border-red-800"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-red-200">{error}</AlertDescription></Alert><Button onClick={fetchSoftware} variant="outline" className="mt-4">Retry</Button></CardContent></Card>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-100">Constelia Software</h2><p className="text-gray-400">Available software packages and their versions</p></div>
        <Button onClick={fetchSoftware} variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      {software.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {software.map((item) => {
              const updateStatus = getUpdateStatus(item.elapsed)
              return (
                <Card key={item.name} className="bg-gray-900 border-gray-800 hover:border-purple-600 transition-colors flex flex-col">
                  <CardHeader className="pb-4"><div className="flex items-start justify-between"><CardTitle className="text-lg text-gray-100 leading-tight">{item.name}</CardTitle><Badge className={`${updateStatus.color} text-white text-xs ml-2 shrink-0`}>{updateStatus.text}</Badge></div></CardHeader>
                  <CardContent className="space-y-4 pt-0 flex-grow flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm"><span className="text-gray-400">Version:</span><span className="text-gray-200 font-mono">{item.version}</span></div>
                      <div className="flex items-center justify-between text-sm"><span className="text-gray-400">Updated:</span><div className="flex items-center gap-1 text-gray-200"><Clock className="h-3 w-3" /><span>{item.elapsed}</span></div></div>
                      <div className="text-xs text-gray-500">{new Date(item.last_update * 1000).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-2 pt-2"><Button onClick={() => downloadSoftware(item.name)} size="sm" className="flex-1 h-8">Download</Button><Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent h-8" onClick={() => handleInfoClick(item.name)}>Info</Button></div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <Card className="bg-gray-900 border-gray-800"><CardHeader className="pb-4"><CardTitle className="text-gray-100">Software Statistics</CardTitle></CardHeader><CardContent className="pt-0"><div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2"><div className="text-3xl font-bold text-purple-400">{stats.total}</div><div className="text-sm text-gray-400">Total</div></div>
            <div className="space-y-2"><div className="text-3xl font-bold text-green-400">{stats.recent}</div><div className="text-sm text-gray-400">Recent</div></div>
            <div className="space-y-2"><div className="text-3xl font-bold text-yellow-400">{stats.moderate}</div><div className="text-sm text-gray-400">Moderate</div></div>
            <div className="space-y-2"><div className="text-3xl font-bold text-red-400">{stats.old}</div><div className="text-sm text-gray-400">Old</div></div>
          </div></CardContent></Card>
        </>
      ) : (
        <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="text-center text-gray-400"><Package className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No software available</p></div></CardContent></Card>
      )}
      <SoftwareInfoDialog
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        softwareName={selectedSoftwareName}
        apiKey={apiKey}
      />
    </div>
  )
}