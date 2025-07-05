"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Send, Loader2, CheckCircle, AlertCircle, Code } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Consistent API base URL
const API_BASE_URL = "https://constelia.ai/api.php"

interface ApiMethod {
  name: string
  params: string[]
  description: string
}

interface ApiMethodPanelProps {
  methods: ApiMethod[]
  category: string
  apiKey: string
  userInfo: any
}

interface ApiResponse {
  success: boolean
  data?: any
  error?: string
  status?: number
}

export function ApiMethodPanel({ methods, category, apiKey, userInfo }: ApiMethodPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<ApiMethod | null>(null)
  const [methodParams, setMethodParams] = useState<Record<string, string>>({})
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Centralized API request handler for consistency and robustness.
  const handleApiRequest = async (url: string, options: RequestInit = {}) => {
    setLoading(true)
    setResponse(null)
    try {
      const res = await fetch(url, options)
      const responseText = await res.text()

      // Improved response cleaning
      let cleanedResponse = responseText.trim()
      if (cleanedResponse.startsWith("<pre>")) {
        cleanedResponse = cleanedResponse.substring(5, cleanedResponse.length - 6).trim()
      }

      let data
      try {
        data = JSON.parse(cleanedResponse)
      } catch (e) {
        data = cleanedResponse
      }

      const apiResponse: ApiResponse = {
        success: res.ok,
        data: data,
        status: res.status,
      }

      if (!res.ok) {
        apiResponse.error = typeof data === 'object' && data.error ? data.error : cleanedResponse
      }

      setResponse(apiResponse)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "A network error occurred."
      setResponse({ success: false, error: errorMessage, status: 0 })
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const executeApiCall = async () => {
    if (!selectedMethod || !apiKey) {
      toast({ title: "Error", description: "API key and a selected method are required.", variant: "destructive" })
      return
    }

    // Clearer validation for required parameters.
    const requiredParams = selectedMethod.params.filter((p) => !p.endsWith("?"))
    const missingParams = requiredParams.filter((p) => !methodParams[p.replace("?", "")]?.trim())

    if (missingParams.length > 0) {
      setResponse({
        success: false,
        error: `Missing required parameters: ${missingParams.join(", ")}`,
      })
      return
    }

    // Use URLSearchParams for safer and cleaner URL construction.
    const params = new URLSearchParams({ key: apiKey, cmd: selectedMethod.name })
    Object.entries(methodParams).forEach(([key, value]) => {
      if (value.trim()) {
        params.append(key, value)
      }
    })

    const url = `${API_BASE_URL}?${params.toString()}`
    await handleApiRequest(url)
  }

  // Auto-populate parameters when user info is available.
  useEffect(() => {
    if (selectedMethod && userInfo) {
      const newParams = { ...methodParams }
      let paramsChanged = false

      selectedMethod.params.forEach(param => {
        const cleanParam = param.replace("?", "")
        const autoPopulateValue = {
          name: userInfo.username,
          protection: userInfo.protection?.toString(),
          owner: userInfo.username,
        }[cleanParam]

        if (autoPopulateValue && !newParams[cleanParam]) {
          newParams[cleanParam] = autoPopulateValue
          paramsChanged = true
        }
      })

      if (paramsChanged) {
        setMethodParams(newParams)
      }
    }
  }, [selectedMethod, userInfo])

  const handleMethodSelect = (method: ApiMethod) => {
    setSelectedMethod(method)
    setResponse(null)
    const initialParams: Record<string, string> = {}
    method.params.forEach((param) => {
      initialParams[param.replace("?", "")] = ""
    })
    setMethodParams(initialParams)
  }

  const getStatusColor = (status?: number) => {
    if (!status) return "destructive"
    if (status >= 200 && status < 300) return "default"
    if (status >= 400 && status < 500) return "secondary"
    return "destructive"
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {methods.map((method) => (
          <Card
            key={method.name}
            className={`bg-gray-900 border-gray-800 cursor-pointer transition-colors hover:border-purple-600 ${
              selectedMethod?.name === method.name ? "border-purple-600 bg-gray-800" : ""
            }`}
            onClick={() => handleMethodSelect(method)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-100">{method.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-400 mb-2">{method.description}</p>
              {method.params.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {method.params.map((param) => (
                    <Badge key={param} variant="outline" className="text-xs border-gray-600 text-gray-400">
                      {param}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedMethod && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-100">Configure {selectedMethod.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedMethod.params.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Parameters</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedMethod.params.map((param) => {
                    const cleanParam = param.replace("?", "")
                    const isRequired = !param.endsWith("?")
                    return (
                      <div key={cleanParam} className="space-y-1">
                        <Label htmlFor={cleanParam} className="text-sm text-gray-400">
                          {cleanParam} {isRequired && <span className="text-destructive">*</span>}
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
              </div>
            )}

            <Button onClick={executeApiCall} disabled={loading || !apiKey} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Execute {selectedMethod.name}</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <Code className="h-5 w-5" />
              API Response
              {response.status != null && <Badge variant={getStatusColor(response.status)}>{response.status}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert
              variant={response.success ? "default" : "destructive"}
              className={response.success ? "bg-green-950 border-green-800" : "bg-red-950 border-red-800"}
            >
              <div className="flex items-center gap-2">
                {response.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertDescription className={response.success ? "text-success-foreground" : "text-destructive-foreground"}>
                  {response.success ? "API call successful" : `API call failed: ${response.error || "Unknown error"}`}
                </AlertDescription>
              </div>
            </Alert>

            {response.data && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Response Data</Label>
                <Textarea
                  value={typeof response.data === "string" ? response.data : JSON.stringify(response.data, null, 2)}
                  readOnly
                  className="className="text-destructive""
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}