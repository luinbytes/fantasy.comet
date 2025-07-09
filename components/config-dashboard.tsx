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
interface ConfigDashboardProps {
  apiKey: string;
  handleApiRequest: (params: Record<string, any>, method?: "GET" | "POST", postData?: Record<string, any>) => Promise<any | null>;
}

interface ConfigData {
  [key: string]: any
}

export function ConfigDashboard({ apiKey, handleApiRequest }: ConfigDashboardProps) {
  const [config, setConfig] = useState<ConfigData | null>(null)
  const [rawConfig, setRawConfig] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingRaw, setEditingRaw] = useState(false)
  const [tempRawConfig, setTempRawConfig] = useState<string>("")
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await handleApiRequest({ cmd: "getConfiguration" }); // result will be raw text or { error: ... }
    if (result && typeof result === 'string') { // Check if it's a string (raw config)
      setRawConfig(result);
      try {
        setConfig(result.trim() ? JSON.parse(result) : null);
      } catch {
        setConfig(null); // Not valid JSON
      }
    } else if (result && result.error) { // Handle error object from callApi
      setError(result.error);
      setConfig(null);
    } else { // No result or unexpected
      setConfig(null);
      setRawConfig("");
    }
    setLoading(false);
  }, [handleApiRequest])

  const saveConfig = async (configData: string) => {
    setSaving(true)
    const result = await handleApiRequest(
      { cmd: "setConfiguration" },
      "POST",
      { value: configData } // postData
    )
    setSaving(false)

    if (result) { // result will be JSON object or { error: ... }
      toast({ title: "Success", description: "Configuration saved successfully." })
      await fetchConfig()
      setEditingRaw(false)
    }
  }

  const resetConfig = async () => {
    setSaving(true)
    const result = await handleApiRequest({ cmd: "resetConfiguration" }) // Pass params as object
    setSaving(false)

    if (result) { // result will be JSON object or { error: ... }
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

    const lastKey = path[path.length - 1];
    // Special handling for array of numbers (like 'bones')
    if (Array.isArray(current[lastKey]) && typeof value === 'string') {
      current[lastKey] = value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    } else {
      current[lastKey] = value
    }

    setConfig(newConfig)
    setRawConfig(JSON.stringify(newConfig, null, 2))
  }

  const renderConfigValue = (value: any, path: string[]): JSX.Element => {
    const key = path.join('-'); // Unique key for React
    const settingName = path[path.length - 1]; // Get the actual setting name

    if (typeof value === "boolean") {
      return <Switch key={key} checked={value} onCheckedChange={(checked) => updateConfigValue(path, checked)} />;
    }
    if (typeof value === "number") {
      return <Input key={key} type="number" value={value} onChange={(e) => updateConfigValue(path, parseFloat(e.target.value) || 0)} className="bg-gray-800 border-gray-700 text-gray-100 w-32" />;
    }
    if (typeof value === "string") {
      // Heuristic for color strings
      if (settingName.includes("color") && value.match(/^[0-9A-Fa-f]{6,8}$/)) {
        return (
          <div key={key} className="flex items-center gap-2">
            <Input
              type="color"
              value={`#${value}`}
              onChange={(e) => updateConfigValue(path, e.target.value.substring(1))}
              className="h-8 w-8 p-0 border-none"
            />
            <Input
              value={value}
              onChange={(e) => updateConfigValue(path, e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100 flex-1"
            />
          </div>
        );
      }
      // For other strings, including toggle_key
      return <Input key={key} value={value} onChange={(e) => updateConfigValue(path, e.target.value)} className="bg-gray-800 border-gray-700 text-gray-100" />;
    }
    if (Array.isArray(value)) {
      // Assuming arrays are arrays of numbers for now (like 'bones')
      return (
        <div key={key} className="flex flex-wrap items-center gap-2">
          {value.map((item, index) => (
            <Badge key={index} variant="secondary" className="bg-gray-800 text-gray-300 flex items-center gap-1">
              {item}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 text-gray-400 hover:text-white"
                onClick={() => {
                  const newArray = [...value];
                  newArray.splice(index, 1);
                  updateConfigValue(path, newArray);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Input
            type="number"
            placeholder="Add new..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const newValue = parseInt(e.currentTarget.value);
                if (!isNaN(newValue) && !value.includes(newValue)) {
                  updateConfigValue(path, [...value, newValue]);
                  e.currentTarget.value = ''; // Clear input
                }
              }
            }}
            className="bg-gray-800 border-gray-700 text-gray-100 w-24"
          />
        </div>
      );
    }
    // If it's an object (nested configuration), render its properties recursively
    if (typeof value === "object" && value !== null) {
      return (
        <div key={key} className="space-y-2">
          {Object.entries(value).map(([nestedKey, nestedValue]) => (
            <div key={nestedKey} className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-300">{nestedKey}</Label>
              {renderConfigValue(nestedValue, [...path, nestedKey])}
            </div>
          ))}
        </div>
      );
    }
    return <span key={key} className="text-gray-400 text-sm">Unsupported type</span>;
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
                          <div key={scriptName} className="border border-gray-800 rounded-lg p-4 bg-gray-900">
                            <h3 className="text-lg font-semibold text-gray-100 mb-4">{scriptName}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {Object.entries(scriptConfig as object).map(([key, value]) => (
                                <div key={key} className="p-3 rounded-md border border-gray-700 bg-gray-850 space-y-2">
                                  <Label className="text-sm font-medium text-gray-300">{key}</Label>
                                  {renderConfigValue(value, [software, scriptName, key])}
                                </div>
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