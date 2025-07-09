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

/**
 * @interface ApiMethod
 * @description Defines the structure for an API method.
 * @property {string} name - The name of the API method.
 * @property {string[]} params - An array of parameter names for the method.
 * @property {string} description - A description of what the method does.
 */
interface ApiMethod {
  name: string
  params: string[]
  description: string
}

/**
 * @interface ApiMethodPanelProps
 * @description Props for the ApiMethodPanel component.
 * @property {ApiMethod[]} methods - An array of API methods to display.
 * @property {string} category - The category of the API methods.
 * @property {string} apiKey - The API key for authentication.
 * @property {any} userInfo - User information, potentially used for auto-populating parameters.
 * @property {(params: Record<string, any>, method?: "GET" | "POST", postData?: Record<string, any>) => Promise<any | null>} handleApiRequest - Function to handle API requests.
 */
interface ApiMethodPanelProps {
  methods: ApiMethod[]
  category: string
  apiKey: string
  userInfo: any
  handleApiRequest: (params: Record<string, any>, method?: "GET" | "POST", postData?: Record<string, any>) => Promise<any | null>;
}

/**
 * @interface ApiResponse
 * @description Defines the structure for an API response.
 * @property {boolean} success - Indicates if the API call was successful.
 * @property {any} [data] - The data returned from the API.
 * @property {string} [error] - An error message if the API call failed.
 * @property {number} [status] - The HTTP status code of the response.
 */
interface ApiResponse {
  success: boolean
  data?: any
  error?: string
  status?: number
}

/**
 * @function ApiMethodPanel
 * @description A component to display and test individual API methods within a category.
 * Allows users to input parameters and execute API calls.
 * @param {ApiMethodPanelProps} props - The component props.
 * @returns {JSX.Element} The API method panel UI.
 */
export function ApiMethodPanel({ methods, category, apiKey, userInfo, handleApiRequest }: ApiMethodPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<ApiMethod | null>(null)
  const [methodParams, setMethodParams] = useState<Record<string, string>>({}) // State to hold parameter values for the selected method
  const [response, setResponse] = useState<ApiResponse | null>(null) // State to hold the API response
  const [loading, setLoading] = useState(false) // State to indicate if an API call is in progress
  const { toast } = useToast()

  /**
   * @function executeApiCall
   * @description Executes the selected API method with the provided parameters.
   * Validates required parameters and handles API response, including success and error states.
   * @returns {Promise<void>}
   */
  const executeApiCall = async () => {
    if (!selectedMethod || !apiKey) {
      toast({ title: "Error", description: "API key and a selected method are required.", variant: "destructive" })
      return
    }

    // Validate that all required parameters have been provided
    const requiredParams = selectedMethod.params.filter((p) => !p.endsWith("?"))
    const missingParams = requiredParams.filter((p) => !methodParams[p.replace("?", "")].trim())

    if (missingParams.length > 0) {
      setResponse({
        success: false,
        error: `Missing required parameters: ${missingParams.join(", ")}`,
      })
      return
    }

    setLoading(true);
    setResponse(null);

    const params: Record<string, any> = { cmd: selectedMethod.name };
    let postData: Record<string, any> | undefined = undefined;
    let method: "GET" | "POST" = "GET";

    // Special handling for POST methods like 'updateScript' or 'teachConstelia'
    if (selectedMethod.name === "updateScript" || selectedMethod.name === "teachConstelia") {
      method = "POST";
      postData = {};
      Object.entries(methodParams).forEach(([key, value]) => {
        if (value.trim()) {
          postData![key] = value; // Use postData for POST parameters
        }
      });
    } else {
      Object.entries(methodParams).forEach(([key, value]) => {
        if (value.trim()) {
          params[key] = value; // Use params for GET query string
        }
      });
    }

    const result = await handleApiRequest(params, method, postData);

    if (result) {
      const apiResponse: ApiResponse = {
        success: true,
        data: result,
        status: result.code || 200, // Use result.code if available, otherwise 200
      };
      setResponse(apiResponse);
    } else {
      setResponse({ success: false, error: "API call failed or returned no data.", status: 0 });
    }
    setLoading(false);
  }

  /**
   * @description Auto-populates method parameters when user info is available and a method is selected.
   * This is useful for methods that require user-specific data like username or protection level.
   */
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

  /**
   * @function handleMethodSelect
   * @description Sets the currently selected API method and initializes its parameters.
   * @param {ApiMethod} method - The API method to select.
   * @returns {void}
   */
  const handleMethodSelect = (method: ApiMethod) => {
    setSelectedMethod(method)
    setResponse(null)
    const initialParams: Record<string, string> = {}
    method.params.forEach((param) => {
      initialParams[param.replace("?", "")] = ""
    })
    setMethodParams(initialParams)
  }

  /**
   * @function getStatusColor
   * @description Determines the color of the status badge based on the HTTP status code.
   * @param {number} [status] - The HTTP status code.
   * @returns {"destructive" | "default" | "secondary"} The variant name for the Badge component.
   */
  const getStatusColor = (status?: number) => {
    if (!status) return "destructive"
    if (status >= 200 && status < 300) return "default"
    if (status >= 400 && status < 500) return "secondary"
    return "destructive"
  }

  return (
    <div className="space-y-6">
      {/* Grid display for available API methods */}
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

      {/* Configuration panel for the selected API method */}
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

      {/* Display area for API response */}
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
