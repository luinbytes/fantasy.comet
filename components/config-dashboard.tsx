"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  RefreshCw,
  Settings,
  AlertCircle,
  Save,
  RotateCcw,
  FileText,
  ChevronDown,
  ChevronRight,
  Edit3,
  Check,
  X,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { JSX } from "react/jsx-runtime"

// Centralized API URL and request handler for consistency.
const API_BASE_URL = "https://constelia.ai/api.php"

interface ConfigDashboardProps {
  apiKey: string
}

interface ConfigData {
  [key: string]: any
}

export function ConfigDashboard({ apiKey }: ConfigDashboardProps) {
  const [config, setConfig] = useState<ConfigData | null>(null)
  const [rawConfig, setRawConfig] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingRaw, setEditingRaw] = useState(false)
  const [tempRawConfig, setTempRawConfig] = useState<string>("")
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  // Generic API handler to reduce duplication and improve error handling.
  const handleApiRequest = useCallback(async (cmd: string, options: RequestInit = {}) => {
    if (!apiKey) return null

    const url = `${API_BASE_URL}?key=${encodeURIComponent(apiKey)}&cmd=${encodeURIComponent(cmd)}`

    try {
      const res = await fetch(url, options)
      const responseText = await res.text()

      if (!res.ok) {
        throw new Error(responseText || `HTTP ${res.status}`)
      }
      return responseText
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      setError(errorMessage)
      toast({ title: "API Error", description: errorMessage, variant: "destructive" })
      return null
    }
  }, [apiKey, toast])

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    setError(null)
    const responseText = await handleApiRequest("getConfiguration")
    if (responseText !== null) {
      setRawConfig(responseText)
      try {
        setConfig(responseText.trim() ? JSON.parse(responseText) : null)
      } catch {
        setConfig(null) // Not valid JSON
      }
    }
    setLoading(false)
  }, [handleApiRequest])

  const saveConfig = async (configData: string) => {
    setSaving(true)
    const result = await handleApiRequest("setConfiguration", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `value=${encodeURIComponent(configData)}`,
    })
    setSaving(false)

    if (result !== null) {
      toast({ title: "Success", description: "Configuration saved successfully." })
      await fetchConfig()
      setEditingRaw(false)
    }
  }

  const resetConfig = async () => {
    setSaving(true)
    const result = await handleApiRequest("resetConfiguration")
    setSaving(false)

    if (result !== null) {
      toast({ title: "Success", description: "Configuration has been reset." })
      await fetchConfig()
    }
  }

  useEffect(() => {
    if (apiKey) {
      fetchConfig()
    }
  }, [apiKey, fetchConfig])

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey)
      } else {
        newSet.add(sectionKey)
      }
      return newSet
    })
  }

  const updateConfigValue = (path: string[], value: any) => {
    if (!config) return

    const newConfig = JSON.parse(JSON.stringify(config)) // Deep copy
    let current = newConfig
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }
    current[path[path.length - 1]] = value

    setConfig(newConfig)
    setRawConfig(JSON.stringify(newConfig, null, 2))
  }

  const renderConfigValue = (value: any, path: string[]): JSX.Element => {
    const key = path.join('-')
    if (typeof value === "boolean") {
      return <Switch key={key} checked={value} onCheckedChange={(checked) => updateConfigValue(path, checked)} />
    }
    if (typeof value === "number") {
      return <Input key={key} type="number" value={value} onChange={(e) => updateConfigValue(path, parseFloat(e.target.value) || 0)} className="bg-gray-800 border-gray-700 text-gray-100 w-32" />
    }
    if (typeof value === "string") {
      return <Input key={key} value={value} onChange={(e) => updateConfigValue(path, e.target.value)} className="bg-gray-800 border-gray-700 text-gray-100" />
    }
    if (Array.isArray(value)) {
      return (
        <div key={key} className="space-y-1">
          {value.map((item, index) => <Badge key={index} variant="outline" className="border-gray-600 text-gray-300 mr-1">{item}</Badge>)}
        </div>
      )
    }
    return <span key={key} className="text-gray-400 text-sm">Complex object</span>
  }

  if (!apiKey) {
    return (
      <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="text-center text-gray-400"><Settings className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Enter your API key to view configuration</p></div></CardContent></Card>
    )
  }

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="flex items-center justify-center space-x-2 text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /><span>Loading configuration...</span></div></CardContent></Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><Alert variant="destructive" className="bg-red-950 border-red-800"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-red-200">{error}</AlertDescription></Alert><Button onClick={fetchConfig} variant="outline" className="mt-4 border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"><RefreshCw className="h-4 w-4 mr-2" />Retry</Button></CardContent></Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1"><h2 className="text-2xl font-bold text-gray-100">Cloud Configuration</h2><p className="text-gray-400">Manage your Constelia software configurations</p></div>
        <div className="flex gap-2">
          <Button onClick={fetchConfig} variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" disabled={saving} className="border-red-700 text-red-300 hover:bg-red-900 bg-transparent"><RotateCcw className="h-4 w-4 mr-2" />Reset</Button></AlertDialogTrigger>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will reset your configuration to its default state. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={resetConfig}>Continue</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {!rawConfig.trim() ? (
        <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="text-center text-gray-400"><FileText className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No configuration found</p></div></CardContent></Card>
      ) : (
        <Tabs defaultValue="visual" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900 border-gray-800"><TabsTrigger value="visual">Visual Editor</TabsTrigger><TabsTrigger value="raw">Raw JSON</TabsTrigger></TabsList>
          <TabsContent value="visual" className="space-y-6">
            {config ? (
              <div className="space-y-4">
                {Object.entries(config).map(([software, content]) => (
                  <Card key={software} className="bg-gray-900 border-gray-800">
                    <Collapsible open={expandedSections.has(software)} onOpenChange={() => toggleSection(software)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-800"><div className="flex items-center justify-between"><CardTitle className="text-gray-100 capitalize">{software}</CardTitle><div className="flex items-center gap-2"><Badge variant="secondary">{Object.keys(content).length} items</Badge>{expandedSections.has(software) ? <ChevronDown /> : <ChevronRight />}</div></div></CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent><CardContent className="pt-0"><div className="space-y-4">
                        {Object.entries(content).map(([scriptName, scriptConfig]) => (
                          <div key={scriptName} className="border border-gray-800 rounded-lg p-4">
                            <h4 className="font-medium text-gray-200 mb-3">{scriptName}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.entries(scriptConfig as object).map(([key, value]) => (
                                <div key={key} className="space-y-2"><Label className="text-sm text-gray-400">{key}</Label>{renderConfigValue(value, [software, scriptName, key])}</div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div></CardContent></CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
                <div className="flex justify-end"><Button onClick={() => saveConfig(JSON.stringify(config, null, 2))} disabled={saving}>{saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Configuration</>}</Button></div>
              </div>
            ) : (
              <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><Alert className="bg-yellow-950 border-yellow-800"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-yellow-200">Configuration is not valid JSON. Edit in Raw JSON tab.</AlertDescription></Alert></CardContent></Card>
            )}
          </TabsContent>
          <TabsContent value="raw" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-gray-100">Raw Configuration</CardTitle><div className="flex gap-2">
                {editingRaw ? (
                  <><Button onClick={() => saveConfig(tempRawConfig)} disabled={saving} size="sm" className="bg-green-600"><Check className="h-4 w-4 mr-1" />Save</Button><Button onClick={() => setEditingRaw(false)} variant="outline" size="sm"><X className="h-4 w-4 mr-1" />Cancel</Button></>
                ) : (
                  <Button onClick={() => { setEditingRaw(true); setTempRawConfig(rawConfig); }} variant="outline" size="sm"><Edit3 className="h-4 w-4 mr-1" />Edit</Button>
                )}
              </div></div></CardHeader>
              <CardContent>
                {editingRaw ? (
                  <Textarea value={tempRawConfig} onChange={(e) => setTempRawConfig(e.target.value)} className="min-h-[400px] font-mono text-sm" placeholder="Enter valid JSON..." />
                ) : (
                  <div className="bg-gray-800 rounded-lg overflow-hidden"><pre className="p-4 overflow-auto max-h-96 text-sm"><code className="language-json">{rawConfig ? JSON.stringify(JSON.parse(rawConfig), null, 2) : ""}</code></pre></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}