import { useState, useEffect, useMemo, useCallback, useRef } from "react"
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

// Define a more precise interface for the Script object.
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

interface ScriptsDashboardProps {
  apiKey: string;
  handleApiRequest: (params: Record<string, string>) => Promise<string | null>;
  isActive: boolean;
}

const API_BASE_URL = "https://constelia.ai/api.php"



  export function ScriptsDashboard({ apiKey, handleApiRequest, isActive }: ScriptsDashboardProps) {
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState("newest")
  const [openScriptId, setOpenScriptId] = useState<string | number | null>(null)
  const [showEnabledOnly, setShowEnabledOnly] = useState(false)
  const [enabledScriptIds, setEnabledScriptIds] = useState<Set<string | number>>(new Set())
  const [categoryFilter, setCategoryFilter] = useState("all")

  const { toast } = useToast()

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

  const fetchScripts = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await handleApiRequest({ cmd: "getAllScripts" })
    if (result) {
      try {
        const data = JSON.parse(result)
        if (Array.isArray(data)) {
          setScripts(data)
        } else if (data.error) {
          setError(data.error)
        } else {
          setError("Unexpected response format for scripts.")
        }
      } catch {
        setError("Failed to parse scripts data.")
      }
    }
    setLoading(false)
  }, [handleApiRequest])

  const fetchEnabledScripts = useCallback(async () => {
    const result = await handleApiRequest({ cmd: "getMember", scripts: "true" })
    if (result) {
      try {
        const data = JSON.parse(result)
        if (data.scripts && Array.isArray(data.scripts)) {
          const ids = new Set(data.scripts.map((s: Script) => s.id))
          setEnabledScriptIds(ids)
        }
      } catch (e) {
        console.error("Failed to parse enabled scripts:", e)
        toast({
          title: "Could not fetch enabled scripts",
          description: "The list of all scripts was loaded, but we couldn't identify which ones are enabled.",
          variant: "destructive"
        })
      }
    }
  }, [handleApiRequest, toast])

  useEffect(() => {
    if (apiKey && isActive) {
      fetchScripts();
      fetchEnabledScripts();
    }
  }, [apiKey, isActive, fetchScripts, fetchEnabledScripts]);

  const SOFTWARE_ID_TO_NAME: { [key: string]: string } = {
    "4": "Constellation4",
    "5": "Global Script",
    "6": "Omega",
  }

  const filteredAndSortedScripts = useMemo(() => {
    return scripts
      .filter(script => {
        const searchTermMatch = script.name.toLowerCase().includes(searchTerm.toLowerCase())
        const enabledMatch = !showEnabledOnly || enabledScriptIds.has(script.id)
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

  if (!apiKey) {
    return <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="text-center text-gray-400"><Code className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Enter your API key to view scripts</p></div></CardContent></Card>
  }

  if (loading) {
    return <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="flex items-center justify-center space-x-2 text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /><span>Loading scripts...</span></div></CardContent></Card>
  }

  if (error) {
    return <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><Alert variant="destructive" className="bg-red-950 border-red-800"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-red-200">{error}</AlertDescription></Alert><Button onClick={() => { fetchScripts(); fetchEnabledScripts(); }} variant="outline" className="mt-4">Retry</Button></CardContent></Card>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Your Scripts</h2>
          <p className="text-gray-400">Manage and control your Constelia scripts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search scripts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 border-gray-700 pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-enabled"
              checked={showEnabledOnly}
              onCheckedChange={setShowEnabledOnly}
              className=""
            />
            <Label htmlFor="show-enabled" className="text-gray-300">Show Enabled Only</Label>
          </div>
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
          <Button onClick={() => { fetchScripts(); fetchEnabledScripts(); }} variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredAndSortedScripts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedScripts.map((script) => (
            <Card key={script.id} className="bg-gray-900 border-gray-800">
              <Collapsible open={openScriptId === script.id} onOpenChange={() => setOpenScriptId(openScriptId === script.id ? null : script.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-800/50">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg text-gray-100">{script.name}</CardTitle>
                        {enabledScriptIds.has(script.id) && <Badge variant="success">Enabled</Badge>}
                      </div>
                      {openScriptId === script.id ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
                    </div>
                    <div className="text-sm text-gray-400">{SOFTWARE_ID_TO_NAME[script.software] || script.software}</div>
                    {Array.isArray(script.category_names) && script.category_names.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{script.category_names.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}</div>}
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-3">
                    <p className="text-sm text-gray-400">Author: {script.author}</p>
                    <p className="text-sm text-gray-400">Last Update: {script.elapsed}</p>
                    {script.update_notes && <p className="text-sm text-gray-300 bg-gray-800 p-2 rounded">Notes: {script.update_notes}</p>}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="text-center text-gray-400"><Code className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No scripts found matching your criteria</p></div></CardContent></Card>
      )}
    </div>
  )
}