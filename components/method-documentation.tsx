import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, AlertTriangle } from "lucide-react"

interface MethodDocProps {
  method: string
  category: string
}

export function MethodDocumentation({ method, category }: MethodDocProps) {
  const getMethodInfo = (methodName: string) => {
    const specialMethods = {
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

  if (!methodInfo) return null

  return (
    <Card className="mt-4 bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-gray-100">
          <Info className="h-4 w-4" />
          Method Information
          <Badge variant="outline" className="border-gray-700 text-gray-300">
            {method}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {methodInfo.note && (
          <Alert className="bg-blue-950 border-blue-800">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-blue-200">{methodInfo.note}</AlertDescription>
          </Alert>
        )}

        {methodInfo.warning && (
          <Alert variant="destructive" className="bg-red-950 border-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200">{methodInfo.warning}</AlertDescription>
          </Alert>
        )}

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
