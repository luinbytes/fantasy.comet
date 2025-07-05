"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Copy, Download, Loader2, AlertCircle, Code2, Terminal, FileText, Trash2 } from "lucide-react"
import { allApiMethods } from "@/lib/api-methods"
import { useToast } from "@/hooks/use-toast"

// It's good practice to define interfaces for the data structures being used.
interface ApiMethod {
  name: string
  params: string[]
  description: string
  category: string
}

interface ApiTestDashboardProps {
  apiKey: string;
  handleApiRequest: (params: Record<string, string>) => Promise<string | null>;
}

interface TestResult {
  id: string
  method: string
  url: string
  params: Record<string, string>
  response: any
  status: number
  timestamp: Date
  success: boolean
  error?: string
}

const API_BASE_URL = "https://constelia.ai/api.php"

export function ApiTestDashboard({ apiKey, handleApiRequest }: ApiTestDashboardProps) {
  const [selectedMethod, setSelectedMethod] = useState<ApiMethod | null>(null)
  const [methodParams, setMethodParams] = useState<Record<string, string>>({})
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const { toast } = useToast()

  // Memoizing categories to prevent recalculation on every render.
  const categories = useMemo(() => ["all", ...Array.from(new Set(allApiMethods.map((m) => m.category)))], [])

  const filteredMethods = useMemo(() =>
    selectedCategory === "all" ? allApiMethods : allApiMethods.filter((m) => m.category === selectedCategory)
  , [selectedCategory])

  const executeApiCall = async (method: ApiMethod) => {
    if (!apiKey) {
      toast({ title: "API Key Required", description: "Please provide your API key.", variant: "destructive" })
      return
    }

    setLoading(true)
    const testId = Date.now().toString()

    const params: Record<string, string> = { cmd: method.name };
    Object.entries(methodParams).forEach(([key, value]) => {
      if (value.trim()) {
        params[key] = value;
      }
    });

    const result = await handleApiRequest(params);

    if (result) {
      try {
        const parsedResponse = JSON.parse(result);
        const testResult: TestResult = {
          id: testId,
          method: method.name,
          url: "", // URL is now handled by handleApiRequest
          params: methodParams,
          response: parsedResponse,
          status: 200, // Assuming 200 for successful parse
          timestamp: new Date(),
          success: true,
          error: undefined,
        };
        setTestResults((prev) => [testResult, ...prev]);
      } catch (e) {
        const testResult: TestResult = {
          id: testId,
          method: method.name,
          url: "", // URL is now handled by handleApiRequest
          params: methodParams,
          response: result,
          status: 200, // Still consider it a success if it's just text
          timestamp: new Date(),
          success: true,
          error: undefined,
        };
        setTestResults((prev) => [testResult, ...prev]);
      }
    } else {
      const testResult: TestResult = {
        id: testId,
        method: method.name,
        url: "", // URL is now handled by handleApiRequest
        params: methodParams,
        response: null,
        status: 0,
        timestamp: new Date(),
        success: false,
        error: "API call failed or returned no data.",
      };
      setTestResults((prev) => [testResult, ...prev]);
      toast({ title: "Request Failed", description: "API call failed or returned no data.", variant: "destructive" });
    }
    setLoading(false);
  }

  const handleMethodSelect = (method: ApiMethod) => {
    setSelectedMethod(method)
    const params: Record<string, string> = {}
    method.params.forEach((param) => {
      const cleanParam = param.replace("?", "")
      // Pre-fill with sensible defaults for a better testing experience.
      const defaults: Record<string, string> = {
        flags: "scripts&xp&beautify",
        count: "10",
        protection: "2",
        id: "306", // Example script ID
      }
      params[cleanParam] = defaults[cleanParam] || ""
    })
    setMethodParams(params)
  }

  // Using async/await for cleaner clipboard interaction.
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: "Copied!", description: "Response copied to clipboard." })
    } catch (err) {
      toast({ title: "Copy Failed", description: "Could not copy to clipboard.", variant: "destructive" })
    }
  }

  const downloadResults = () => {
    if (testResults.length === 0) return
    const data = JSON.stringify(testResults, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `constelia-api-test-results-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a) // Required for Firefox
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const clearResults = () => {
    setTestResults([])
  }

  if (!apiKey) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6">
          <div className="text-center text-gray-400">
            <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Enter your API key to test API methods</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-100">API Test Console</h2>
          <p className="text-gray-400">Test all Constelia API methods and view raw responses</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={downloadResults}
            variant="outline"
            disabled={testResults.length === 0}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
          <Button
            onClick={clearResults}
            variant="outline"
            disabled={testResults.length === 0}
            className="border-red-700 text-red-300 hover:bg-red-900 bg-transparent"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Results
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-100">API Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={
                      selectedCategory === category
                        ? "bg-purple-600 text-white"
                        : "border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
                    }
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                <div className="p-4 space-y-2">
                  {filteredMethods.map((method) => (
                    <div
                      key={method.name}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedMethod?.name === method.name
                          ? "border-purple-600 bg-purple-900/20"
                          : "border-gray-800 hover:border-gray-700 hover:bg-gray-800/50"
                      }`}
                      onClick={() => handleMethodSelect(method)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-100">{method.name}</h4>
                        <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                          {method.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{method.description}</p>
                      {method.params.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {method.params.map((param) => (
                            <Badge key={param} variant="secondary" className="bg-gray-800 text-gray-300 text-xs">
                              {param}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {selectedMethod && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-100">Configure {selectedMethod.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedMethod.params.length > 0 && (
                  <div className="space-y-3">
                    {selectedMethod.params.map((param) => {
                      const cleanParam = param.replace("?", "")
                      const isRequired = !param.endsWith("?")
                      return (
                        <div key={cleanParam} className="space-y-1">
                          <Label htmlFor={cleanParam} className="text-sm text-gray-400">
                            {cleanParam} {isRequired && <span className="text-red-400">*</span>}
                          </Label>
                          <Input
                            id={cleanParam}
                            placeholder={`Enter ${cleanParam}`}
                            value={methodParams[cleanParam] || ""}
                            onChange={(e) =>
                              setMethodParams((prev) => ({ ...prev, [cleanParam]: e.target.value }))
                            }
                            className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                          />
                        </div>
                      )
                    })}
                  </div>
                )}

                <Button
                  onClick={() => executeApiCall(selectedMethod)}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Testing...</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" /> Test {selectedMethod.name}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6" id="test-results">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-100">
                <Code2 className="h-5 w-5" />
                Test Results ({testResults.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No test results yet</p>
                  <p className="text-sm mt-1">Select and run an API method to see results</p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-20rem)]">
                  <div className="space-y-4">
                    {testResults.map((result) => (
                      <div key={result.id} className="border border-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-purple-600 text-purple-400">
                              {result.method}
                            </Badge>
                            <Badge
                              variant={result.success ? "default" : "destructive"}
                              className={result.success ? "bg-green-600" : "bg-red-600"}
                            >
                              {result.status || "ERROR"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{result.timestamp.toLocaleTimeString()}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(JSON.stringify(result.response, null, 2))}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {result.error && (
                          <Alert variant="destructive" className="bg-red-950 border-red-800 mb-3">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-red-200">{result.error}</AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-2">
                          <div className="text-sm break-all">
                            <span className="text-gray-400">URL: </span>
                            <code className="text-xs bg-gray-800 px-1 py-0.5 rounded text-gray-300">{result.url}</code>
                          </div>

                          <div>
                            <Label className="text-sm text-gray-400">Response:</Label>
                            <Textarea
                              value={
                                typeof result.response === "string"
                                  ? result.response
                                  : JSON.stringify(result.response, null, 2)
                              }
                              readOnly
                              className="mt-1 min-h-[120px] font-mono text-xs bg-gray-800 border-gray-700 text-gray-100"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}