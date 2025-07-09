import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, AlertTriangle } from "lucide-react"

/**
 * @interface MethodDocProps
 * @description Props for the MethodDocumentation component.
 * @property {string} method - The name of the API method to display documentation for.
 * @property {string} category - The category of the API method (currently unused but part of the interface).
 */
interface MethodDocProps {
  method: string
  category: string
}

/**
 * @component MethodDocumentation
 * @description Displays specific documentation and warnings for selected API methods.
 * @param {MethodDocProps} props - The props for the MethodDocumentation component.
 * @returns {JSX.Element | null} The rendered method documentation card or null if no special information is available.
 */
export function MethodDocumentation({ method, category }: MethodDocProps) {
  /**
   * @function getMethodInfo
   * @description Provides specific notes, warnings, and examples for certain API methods.
   * @param {string} methodName - The name of the method to retrieve information for.
   * @returns {Object | null} An object containing note, warning, and/or example, or null if no special info.
   */
  const getMethodInfo = (methodName: string) => {
    // Defines special handling and documentation for specific API methods.
    const specialMethods: { [key: string]: { note?: string; warning?: string; example?: string } } = {
      updateScript: {
        note: "Requires POST data for script, content, and notes parameters",
        warning: "Notes must be detailed and descriptive per Community Guidelines",
      },
      setConfiguration: {
        note: "Value parameter must be POST data with valid JSON",
        warning: "Automatically validates JSON format",
      },
      getSolution: {
        note: "Do not call in browser - will freeze/crash tab",
        warning: "Use curl command instead for downloading executables",
      },
      getMember: {
        note: "Supports flags: bans, history, scripts, private, xp, rolls, fc2t, hashes, simple, uploads, bonks",
        example: "&scripts&history&bans&beautify",
      },
      setProtection: {
        note: "Protection levels: 0=Standard, 1=IPC/Zombie, 2=Kernel Mode, 3=Minimum(User), 4=Minimum(Kernel)",
        warning: "Default is level 2 (kernel mode)",
      },
      heyConstelia: {
        note: "10-second cooldown between requests",
        warning: "All requests are logged. Community Guidelines strictly enforced",
      },
      teachConstelia: {
        note: "Requires 'Space Engineer' perk",
        warning: "Data must be sent via POST request",
      },
    }

    return specialMethods[methodName] || null
  }

  const methodInfo = getMethodInfo(method)

  // If no special information is found for the method, return null to render nothing.
  if (!methodInfo) return null

  return (
    // Card container for method documentation
    <Card className="mt-4 bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-gray-100">
          <Info className="h-4 w-4" />
          Method Information
          {/* Badge displaying the method name */}
          <Badge variant="outline" className="border-gray-700 text-gray-300">
            {method}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Display a note if available */}
        {methodInfo.note && (
          <Alert className="bg-blue-950 border-blue-800">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-blue-200">{methodInfo.note}</AlertDescription>
          </Alert>
        )}

        {/* Display a warning if available */}
        {methodInfo.warning && (
          <Alert variant="destructive" className="bg-red-950 border-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200">{methodInfo.warning}</AlertDescription>
          </Alert>
        )}

        {/* Display an example if available */}
        {methodInfo.example && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-300">Example usage:</p>
            <code className="text-xs bg-gray-800 p-2 rounded block text-gray-300">{methodInfo.example}</code>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
