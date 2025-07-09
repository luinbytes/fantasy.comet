import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, Code, AlertCircle, ChevronDown, ChevronRight, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

/**
 * @interface Script
 * @description Defines the structure for a script object retrieved from the API.
 * @property {string | number} id - The unique identifier of the script.
 * @property {string} software - The software associated with the script (e.g., Constellation4).
 * @property {string} name - The name of the script.
 * @property {string} author - The author of the script.
 * @property {string} last_update - Timestamp of the last update.
 * @property {string} update_notes - Notes regarding the last update.
 * @property {string} script - The script's source code (if requested).
 * @property {string} core - Core script information.
 * @property {string} forums - Link to forum thread.
 * @property {string} library - Library information.
 * @property {string[]} team - List of team members.
 * @property {string} last_bonus - Last bonus information.
 * @property {number[]} categories - Array of category IDs the script belongs to.
 * @property {string[]} category_names - Array of category names the script belongs to.
 * @property {string} elapsed - Elapsed time since last update (human-readable).
 */
interface Script {
  id: string | number
  software: string
  name: string
  author: string
  last_update: string
  update_notes: string
  script: string
  core: string
  forums: string
  library: string
  team: string[]
  last_bonus: string
  categories: number[]
  category_names: string[]
  elapsed: string
}

/**
 * @interface ScriptsDashboardProps
 * @description Props for the ScriptsDashboard component.
 * @property {string} apiKey - The API key for making requests.
 * @property {(params: Record<string, any>, method?: "GET" | "POST", postData?: Record<string, any>) => Promise<any | null>} handleApiRequest - Function to handle API requests.
 * @property {boolean} isActive - Indicates if the dashboard tab is currently active.
 */
interface ScriptsDashboardProps {
  apiKey: string;
  handleApiRequest: (params: Record<string, any>, method?: "GET" | "POST", postData?: Record<string, any>) => Promise<any | null>;
  isActive: boolean;
}

/**
 * @component ScriptsDashboard
 * @description A dashboard component for managing and viewing Constelia scripts.
 * Allows users to search, filter, sort, and toggle the status of scripts.
 * @param {ScriptsDashboardProps} props - The props for the ScriptsDashboard component.
 * @returns {JSX.Element} The rendered ScriptsDashboard component.
 */
export function ScriptsDashboard({ apiKey, handleApiRequest, isActive }: ScriptsDashboardProps) {
  // State to store the list of all scripts.
  const [scripts, setScripts] = useState<Script[]>([])
  // State to manage loading status during API calls.
  const [loading, setLoading] = useState(true)
  // State to store any error messages from API calls.
  const [error, setError] = useState<string | null>(null)
  // State for the search term to filter scripts.
  const [searchTerm, setSearchTerm] = useState("")
  // State for the sorting order of scripts (newest, oldest, alphabetical).
  const [sortOrder, setSortOrder] = useState("newest")
  // State to control which script's collapsible section is open.
  const [openScriptId, setOpenScriptId] = useState<string | number | null>(null)
  // State to control whether to show only enabled scripts.
  const [showEnabledOnly, setShowEnabledOnly] = useState(false)
  // State to store the IDs of currently enabled scripts.
  const [enabledScriptIds, setEnabledScriptIds] = useState<Set<string | number>>(new Set())
  // State for filtering scripts by category.
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Initialize toast hook for displaying notifications.
  const { toast } = useToast()

  // Hardcoded list of script categories for filtering.
  const SCRIPT_CATEGORIES = [
    { id: 0, name: "Hub" },
    { id: 1, name: "GUI" },
    { id: 2, name: "CLI" },
    { id: 3, name: "Humanizer Add-On" },
    { id: 4, name: "Humanizer Alternative" },
    { id: 5, name: "Dependency / Library" },
    { id: 6, name: "Core Script" },
    { id: 7, name: "ESP" },
    { id: 8, name: "ESP (No Drawing)" },
    { id: 9, name: "Parallax2 Exclusive" },
    { id: 10, name: "Parallactic2 Exclusive" },
    { id: 11, name: "Aurora2 Exclusive" },
    { id: 12, name: "Quality of Life" },
    { id: 13, name: "Source Engine Exclusive" },
    { id: 14, name: "Blender Exclusive" },
    { id: 15, name: "Configuration Management" },
    { id: 16, name: "Alternative Cheating Software" },
    { id: 17, name: "Constelia" },
    { id: 18, name: "Overlay Alternatives" },
    { id: 19, name: "Utility" },
    { id: 20, name: "Legacy (Never Updated)" },
    { id: 21, name: "CS2" },
    { id: 22, name: "TF2" },
    { id: 23, name: "CSS" },
    { id: 24, name: "L4D2" },
    { id: 25, name: "FC2T" },
    { id: 26, name: "Windows Only" },
    { id: 27, name: "Linux Only" },
    { id: 28, name: "Aurora2 Supported" },
  ]

  /**
   * @function fetchScripts
   * @description Fetches all available scripts from the API.
   */
  const fetchScripts = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await handleApiRequest({ cmd: "getAllScripts" })
    if (result) {
      if (Array.isArray(result)) { // result is already parsed JSON
        setScripts(result)
      } else if (result.error) {
        setError(result.error)
      } else {
        setError("Unexpected response format for scripts.")
      }
    } else {
      setError("API call failed or returned no data.");
    }
    setLoading(false)
  }, [handleApiRequest])

  /**
   * @function toggleScriptStatus
   * @description Toggles the enabled/disabled status of a script via API and updates local state.
   * @param {string | number} scriptId - The ID of the script to toggle.
   * @param {string} scriptName - The name of the script for toast notifications.
   */
  const toggleScriptStatus = useCallback(async (scriptId: string | number, scriptName: string) => {
    const cmd = "toggleScriptStatus";
    const result = await handleApiRequest({ cmd, id: String(scriptId) });
    if (result) {
      if (result.status === 200) { // result is already parsed JSON
        toast({
          title: "Script Status Updated",
          description: `${scriptName} has been ${enabledScriptIds.has(Number(scriptId)) ? "disabled" : "enabled"}.`,
        });
        // Optimistically update the UI state only on successful API response
        setEnabledScriptIds((prev: Set<string | number>) => {
          const newSet = new Set(prev);
          const numScriptId = Number(scriptId); // Ensure Number type for consistency
          if (newSet.has(numScriptId)) {
            newSet.delete(numScriptId);
          } else {
            newSet.add(numScriptId);
          }
          return newSet;
        });
      } else {
        toast({
          title: "Error Toggling Script",
          description: result.message || "Failed to toggle script status.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Error Toggling Script",
        description: "API call failed or returned no data.",
        variant: "destructive",
      });
    }
  }, [handleApiRequest, enabledScriptIds, toast]);

  /**
   * @function fetchEnabledScripts
   * @description Fetches the list of scripts currently enabled by the member from the API.
   */
  const fetchEnabledScripts = useCallback(async () => {
    const result = await handleApiRequest({ cmd: "getMember", scripts: "true" })
    if (result) {
      if (result.scripts && Array.isArray(result.scripts)) { // result is already parsed JSON
        const ids = new Set(result.scripts.map((s: { id: string | number }) => Number(s.id)))
        setEnabledScriptIds(ids as Set<string | number>)
      } else if (result.error) {
        console.error("Failed to fetch enabled scripts:", result.error)
        toast({
          title: "Could not fetch enabled scripts",
          description: result.error,
          variant: "destructive"
        })
      } else {
        console.error("Failed to fetch enabled scripts: Unexpected response format", result)
        toast({
          title: "Could not fetch enabled scripts",
          description: "The list of all scripts was loaded, but we couldn't identify which ones are enabled.",
          variant: "destructive"
        })
      }
    } else {
      toast({
        title: "Could not fetch enabled scripts",
        description: "API call failed or returned no data.",
        variant: "destructive"
      })
    }
  }, [handleApiRequest, toast])

  /**
   * @function useEffect
   * @description Effect hook to fetch all scripts and enabled scripts when the component mounts or API key/activity status changes.
   */
  useEffect(() => {
    if (apiKey && isActive) {
      fetchScripts();
      fetchEnabledScripts();
    }
  }, [apiKey, isActive, fetchScripts, fetchEnabledScripts]);

  // Mapping of software IDs to human-readable names.
  const SOFTWARE_ID_TO_NAME: { [key: string]: string } = {
    "4": "Constellation4",
    "5": "Global Script",
    "6": "Omega",
  }

  /**
   * @function useMemo
   * @description Memoized computation for filtering and sorting scripts based on search term, enabled status, and category.
   * @returns {Script[]} The filtered and sorted list of scripts.
   */
  const filteredAndSortedScripts = useMemo(() => {
    return scripts
      .filter(script => {
        const searchTermMatch = script.name.toLowerCase().includes(searchTerm.toLowerCase())
        const enabledMatch = !showEnabledOnly || enabledScriptIds.has(Number(script.id))
        const categoryMatch = categoryFilter === "all" || (Array.isArray(script.category_names) && script.category_names.includes(categoryFilter))
        return searchTermMatch && enabledMatch && categoryMatch
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case "newest":
            return Number(b.last_update) - Number(a.last_update)
          case "oldest":
            return Number(a.last_update) - Number(b.last_update)
          case "alphabetical":
            return a.name.localeCompare(b.name)
          default:
            return 0
        }
      })
  }, [scripts, searchTerm, sortOrder, showEnabledOnly, enabledScriptIds, categoryFilter])

  // Display a message if no API key is provided, prompting the user to enter it.
  if (!apiKey) {
    return <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="text-center text-gray-400"><Code className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Enter your API key to view scripts</p></div></CardContent></Card>
  }

  // Display a loading indicator while scripts are being fetched.
  if (loading) {
    return <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="flex items-center justify-center space-x-2 text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /><span>Loading scripts...</span></div></CardContent></Card>
  }

  // Display an error message if fetching scripts failed.
  if (error) {
    return <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><Alert variant="destructive" className="bg-red-950 border-red-800"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-red-200">{error}</AlertDescription></Alert><Button onClick={() => { fetchScripts(); fetchEnabledScripts(); }} variant="outline" className="mt-4">Retry</Button></CardContent></Card>
  }

  return (
    <div className="space-y-6">
      {/* Header section with title, description, search, filters, and refresh button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Your Scripts</h2>
          <p className="text-gray-400">Manage and control your Constelia scripts</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search input for filtering scripts by name */}
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search scripts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 border-gray-700 pl-10"
            />
          </div>
          {/* Toggle to show only enabled scripts */}
          <div className="flex items-center space-x-2">
            <Switch
              id="show-enabled"
              checked={showEnabledOnly}
              onCheckedChange={setShowEnabledOnly}
              className=""
            />
            <Label htmlFor="show-enabled" className="text-gray-300">Show Enabled Only</Label>
          </div>
          {/* Select dropdown for filtering by category */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700">
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {SCRIPT_CATEGORIES.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Select dropdown for sorting scripts */}
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
          {/* Button to refresh script list */}
          <Button onClick={() => { fetchScripts(); fetchEnabledScripts(); }} variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conditional rendering based on whether scripts are found */}
      {filteredAndSortedScripts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Mapping through filtered and sorted scripts to display each as a card */}
          {filteredAndSortedScripts.map((script) => (
            <Card key={script.id} className="bg-gray-900 border-gray-800">
              {/* Collapsible component for each script to show/hide details */}
              <Collapsible open={openScriptId === script.id} onOpenChange={() => setOpenScriptId(openScriptId === script.id ? null : script.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-800/50">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg text-gray-100">{script.name}</CardTitle>
                        {/* Badge indicating if the script is enabled */}
                        {enabledScriptIds.has(Number(script.id)) && <Badge variant="success">Enabled</Badge>}
                      </div>
                      {/* Chevron icon to indicate collapsible state */}
                      {openScriptId === script.id ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
                    </div>
                    {/* Script software and categories */}
                    <div className="text-sm text-gray-400">{SOFTWARE_ID_TO_NAME[script.software] || script.software}</div>
                    {Array.isArray(script.category_names) && script.category_names.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{script.category_names.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}</div>}
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-3">
                    {/* Script details: author, last update, update notes */}
                    <p className="text-sm text-gray-400">Author: {script.author}</p>
                    <p className="text-sm text-gray-400">Last Update: {script.elapsed}</p>
                    {script.update_notes && <p className="text-sm text-gray-300 bg-gray-800 p-2 rounded">Notes: {script.update_notes}</p>}
                    {/* Button to enable/disable the script */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent collapsible from toggling
                        toggleScriptStatus(script.id, script.name); // Pass script.name
                      }}
                      variant={enabledScriptIds.has(Number(script.id)) ? "destructive" : "default"}
                      size="sm"
                      className="w-full mt-2"
                    >
                      {enabledScriptIds.has(Number(script.id)) ? "Disable" : "Enable"}
                    </Button>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Message displayed when no scripts match the criteria */}
          <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="text-center text-gray-400"><Code className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No scripts found matching your criteria</p></div></CardContent></Card>
        </>
      )}
    </div>
  )
}
