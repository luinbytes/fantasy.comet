"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Download, RefreshCw, Clock, Package, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SoftwareInfoDialog } from "./software-info-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

/**
 * @interface SoftwareDetails
 * @description Defines the structure for software details retrieved from the API.
 * @property {string} version - The version of the software.
 * @property {number} last_update - Timestamp of the last update.
 * @property {string} elapsed - Human-readable string indicating time since last update.
 * @property {string} name - The name of the software.
 * @property {Object} [checksum] - Optional checksum information for Windows and Linux versions.
 * @property {string} [checksum.windows] - Checksum for the Windows version.
 * @property {string} [checksum.linux] - Checksum for the Linux version.
 */
interface SoftwareDetails {
  version: string
  last_update: number
  elapsed: string
  name: string
  checksum?: {
    windows?: string
    linux?: string
  }
}

/**
 * @interface SoftwareDashboardProps
 * @description Props for the SoftwareDashboard component.
 * @property {string} apiKey - The API key for making requests.
 * @property {(params: Record<string, any>, method?: "GET" | "POST", postData?: Record<string, any>) => Promise<any | null>} handleApiRequest - Function to handle API requests.
 */
interface SoftwareDashboardProps {
  apiKey: string
  handleApiRequest: (params: Record<string, any>, method?: "GET" | "POST", postData?: Record<string, any>) => Promise<any | null>;
}

/**
 * @component SoftwareDashboard
 * @description A dashboard component for displaying and managing Constelia software packages.
 * Allows users to view software details, download executables, and see update statuses.
 * @param {SoftwareDashboardProps} props - The props for the SoftwareDashboard component.
 * @returns {JSX.Element} The rendered SoftwareDashboard component.
 */
export function SoftwareDashboard({ apiKey, handleApiRequest }: SoftwareDashboardProps) {
  // State to store the list of software details.
  const [software, setSoftware] = useState<SoftwareDetails[]>([])
  // State to manage loading status during API calls.
  const [loading, setLoading] = useState(true)
  // State to store any error messages from API calls.
  const [error, setError] = useState<string | null>(null)
  // Initialize toast hook for displaying notifications.
  const { toast } = useToast()
  // State to control the visibility of the software info modal.
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  // State to store the details of the currently selected software for the modal.
  const [selectedSoftware, setSelectedSoftware] = useState<SoftwareDetails | null>(null)
  // State to track download progress for each software.
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({})

  /**
   * @function fetchSoftware
   * @description Fetches all available software details from the API, including checksums and scripts.
   */
  const fetchSoftware = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await handleApiRequest({ cmd: "getAllSoftware" })
    if (result) {
      if (Array.isArray(result)) { // result is already parsed JSON
        const detailedSoftware = await Promise.all(
          result.map(async (s) => {
            const detailsResult = await handleApiRequest({ cmd: "getSoftware", name: s.name, checksum: "1", scripts: "1" })
            
            if (detailsResult) { // detailsResult is already parsed JSON
              return { ...s, ...detailsResult }
            }
            return s
          })
        )
        setSoftware(detailedSoftware)
      } else if (result.error) {
        setError(result.error)
      } else {
        setError("Unexpected response format for software.")
      }
    } else {
      setError("API call failed or returned no data.");
    }
    setLoading(false)
  }, [handleApiRequest, toast])

  /**
   * @function useEffect
   * @description Effect hook to fetch software data when the component mounts or API key changes.
   */
  useEffect(() => {
    if (apiKey) {
      fetchSoftware()
    }
  }, [apiKey, fetchSoftware])

  /**
   * @function handleInfoClick
   * @description Opens the software information modal with the details of the selected software.
   * @param {SoftwareDetails} software - The software object to display in the modal.
   */
  const handleInfoClick = (software: SoftwareDetails) => {
    setSelectedSoftware(software)
    setIsInfoModalOpen(true)
  }

  /**
   * @function handleDownload
   * @description Handles the download of a software executable for a specific operating system.
   * Displays download progress and toast notifications.
   * @param {string} softwareName - The name of the software to download.
   * @param {"windows" | "linux"} os - The operating system for which to download the executable.
   */
  const handleDownload = async (softwareName: string, os: "windows" | "linux") => {
    if (!apiKey) return

    setDownloadProgress(prev => ({ ...prev, [softwareName]: 0 }))

    try {
      const result = await handleApiRequest({ cmd: "getSolution", software: softwareName, os: os });

      if (result instanceof Blob) {
        const blobUrl = window.URL.createObjectURL(result)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = `${softwareName}-${os}.${os === 'windows' ? 'exe' : 'out'}`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(blobUrl)
        
        toast({ title: "Download Complete", description: `${softwareName} for ${os} has been downloaded.` })
      } else if (result && result.error) {
        setError(result.error);
        toast({ title: "Download Failed", description: result.error, variant: "destructive" });
      } else {
        setError("An unknown error occurred during download.");
        toast({ title: "Download Failed", description: "An unknown error occurred during download.", variant: "destructive" });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      setError(errorMessage)
      toast({ title: "Download Failed", description: errorMessage, variant: "destructive" })
    } finally {
      setDownloadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[softwareName]
        return newProgress
      })
    }
  }

  /**
   * @function useMemo
   * @description Memoized computation for software statistics (total, recent, moderate, old).
   * @returns {Object} An object containing software statistics.
   */
  const stats = useMemo(() => {
    const recent = software.filter(s => s.elapsed.includes("hour") || s.elapsed.includes("day")).length
    const moderate = software.filter(s => s.elapsed.includes("week") || s.elapsed.includes("month")).length
    const old = software.length - recent - moderate
    return { total: software.length, recent, moderate, old }
  }, [software])

  /**
   * @function getUpdateStatus
   * @description Determines the update status of a software based on its elapsed time.
   * @param {string} elapsed - The human-readable elapsed time since the last update.
   * @returns {{color: string, text: string}} An object with color class and status text.
   */
  const getUpdateStatus = (elapsed: string) => {
    if (elapsed.includes("hour") || elapsed.includes("day")) return { color: "bg-green-600", text: "Recent" }
    if (elapsed.includes("week") || elapsed.includes("month")) return { color: "bg-yellow-600", text: "Moderate" }
    return { color: "bg-red-600", text: "Old" }
  }

  // Display a message if no API key is provided, prompting the user to enter it.
  if (!apiKey) {
    return <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="text-center text-gray-400"><Package className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Enter your API key to view software</p></div></CardContent></Card>
  }

  // Display a loading indicator while software data is being fetched.
  if (loading) {
    return <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="flex items-center justify-center space-x-2 text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /><span>Loading software...</span></div></CardContent></Card>
  }

  // Display an error message if fetching software failed.
  if (error) {
    return <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><Alert variant="destructive" className="bg-red-950 border-red-800"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-red-200">{error}</AlertDescription></Alert><Button onClick={fetchSoftware} variant="outline" className="mt-4">Retry</Button></CardContent></Card>
  }

  return (
    <div className="space-y-8">
      {/* Header section with title, description, and refresh button */}
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-100">Constelia Software</h2><p className="text-gray-400">Available software packages and their versions</p></div>
        <Button onClick={fetchSoftware} variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      {/* Conditional rendering based on whether software is available */}
      {software.length > 0 ? (
        <>
          {/* Grid display of software cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {software.map((item) => {
              const updateStatus = getUpdateStatus(item.elapsed)
              const isDownloading = downloadProgress[item.name] !== undefined
              const hasLinux = !!item.checksum?.linux

              return (
                <Card key={item.name} className="bg-gray-900 border-gray-800 hover:border-purple-600 transition-colors flex flex-col">
                  <CardHeader className="pb-4"><div className="flex items-start justify-between"><CardTitle className="text-lg text-gray-100 leading-tight">{item.name}</CardTitle><Badge className={`${updateStatus.color} text-white text-xs ml-2 shrink-0`}>{updateStatus.text}</Badge></div></CardHeader>
                  <CardContent className="space-y-4 pt-0 flex-grow flex flex-col justify-between">
                    {/* Software version and update time */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm"><span className="text-gray-400">Version:</span><span className="text-gray-200 font-mono">{item.version}</span></div>
                      <div className="flex items-center justify-between text-sm"><span className="text-gray-400">Updated:</span><div className="flex items-center gap-1 text-gray-200"><Clock className="h-3 w-3" /><span>{item.elapsed}</span></div></div>
                      <div className="text-xs text-gray-500">{new Date(item.last_update * 1000).toLocaleDateString()}</div>
                    </div>
                    {/* Download and Info buttons */}
                    <div className="flex flex-col gap-2 pt-2">
                      {/* Download progress bar */}
                      {isDownloading && (
                        <div className="w-full">
                          <Progress value={downloadProgress[item.name]} className="w-full" />
                          <p className="text-xs text-center text-gray-400 mt-1">{downloadProgress[item.name]}%</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {/* Conditional rendering for download button (Windows/Linux) */}
                        {hasLinux ? (
                          <Select onValueChange={(value: "windows" | "linux") => handleDownload(item.name, value)} disabled={isDownloading}>
                            <SelectTrigger className="flex-1 h-8">
                              <SelectValue placeholder="Download" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="windows">Windows</SelectItem>
                              <SelectItem value="linux">Linux</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Button onClick={() => handleDownload(item.name, "windows")} size="sm" className="flex-1 h-8" disabled={isDownloading}>
                            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Download"}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent h-8" onClick={() => handleInfoClick(item)} disabled={isDownloading}>Info</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {/* Software Statistics Card */}
          <Card className="bg-gray-900 border-gray-800"><CardHeader className="pb-4"><CardTitle className="text-gray-100">Software Statistics</CardTitle></CardHeader><CardContent className="pt-0"><div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2"><div className="text-3xl font-bold text-purple-400">{stats.total}</div><div className="text-sm text-gray-400">Total</div></div>
            <div className="space-y-2"><div className="text-3xl font-bold text-green-400">{stats.recent}</div><div className="text-sm text-gray-400">Recent</div></div>
            <div className="space-y-2"><div className="text-3xl font-bold text-yellow-400">{stats.moderate}</div><div className="text-sm text-gray-400">Moderate</div></div>
            <div className="space-y-2"><div className="text-3xl font-bold text-red-400">{stats.old}</div><div className="text-sm text-gray-400">Old</div></div>
          </div></CardContent></Card>
        </>
      ) : (
        <>
          {/* Message displayed when no software is available */}
          <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="text-center text-gray-400"><Package className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No software available</p></div></CardContent></Card>
        </>
      )}
      {/* Software Info Dialog component */}
      <SoftwareInfoDialog
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        softwareDetails={selectedSoftware}
      />
    </div>
  )
}