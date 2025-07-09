"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, MessageSquare, Send, AlertCircle, User, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Define interfaces for better type-safety and code clarity.
interface ForumPost {
  id: number
  thread: number
  title: string
  username: string
  date: string
  message: string
  elapsed: string
}

interface ForumDashboardProps {
  apiKey: string;
  handleApiRequest: (params: Record<string, any>, method?: "GET" | "POST", postData?: Record<string, any>) => Promise<any | null>;
}

const API_BASE_URL = "https://constelia.ai/api.php"

export function ForumDashboard({ apiKey, handleApiRequest }: ForumDashboardProps) {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [postCount, setPostCount] = useState("10")
  const [command, setCommand] = useState("")
  const [commandResult, setCommandResult] = useState<string | null>(null)
  const [commandLoading, setCommandLoading] = useState(false)
  const { toast } = useToast()

  const fetchForumPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    const count = Math.min(Math.max(Number.parseInt(postCount) || 10, 1), 20)
    const result = await handleApiRequest({ cmd: "getForumPosts", count: count.toString() })

    if (result) {
      if (Array.isArray(result)) { // result is already parsed JSON
        setPosts(result)
      } else if (result.error) {
        setError(result.error)
      } else {
        setError("Received an unexpected data format.")
      }
    } else {
      setError("API call failed or returned no data.");
    }
    setLoading(false)
  }, [postCount, handleApiRequest])

  const sendCommand = async () => {
    if (!command.trim()) return
    setCommandLoading(true)
    setCommandResult(null)
    const result = await handleApiRequest({ cmd: "sendCommand", command })
    if (result && typeof result === 'string') { // result is raw text
      setCommandResult(result);
    } else if (result && result.error) { // If it's an error object from callApi
      setCommandResult(result.error);
    } else {
      setCommandResult("API call failed or returned no data.");
    }
    setCommandLoading(false)
  }

  useEffect(() => {
    if (apiKey) {
      fetchForumPosts()
    }
  }, [apiKey, fetchForumPosts])

  if (!apiKey) {
    return (
      <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="text-center text-gray-400"><MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Enter your API key to view forum posts</p></div></CardContent></Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-100">Forum Dashboard</h2><p className="text-gray-400">Latest forum posts and member panel commands</p></div>
        <Button onClick={fetchForumPosts} variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">Latest Forum Posts</CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="post-count" className="text-sm text-gray-300">Count:</Label>
                <Input id="post-count" type="number" min="1" max="20" value={postCount} onChange={(e) => setPostCount(e.target.value)} className="bg-gray-800 border-gray-700 text-gray-100 w-20" />
                <Button onClick={fetchForumPosts} disabled={loading} size="sm">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load"}</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <Alert variant="destructive" className="bg-red-950 border-red-800"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-red-200">{error}</AlertDescription></Alert>}
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {posts.length > 0 ? posts.map((post) => (
                    <Card key={post.id} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2"><h4 className="font-medium text-gray-100 text-sm">{post.title}</h4><Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">#{post.thread}</Badge></div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2"><User className="h-3 w-3" /><span>{post.username}</span><Calendar className="h-3 w-3 ml-2" /><span>{post.elapsed}</span></div>
                        <p className="text-sm text-gray-300 line-clamp-3">{post.message}</p>
                      </CardContent>
                    </Card>
                  )) : <div className="text-center text-gray-400 py-8"><MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No forum posts found</p></div>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="text-gray-100">Member Panel Commands</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="command-input" className="text-gray-300">Command</Label>
                <div className="flex gap-2"><Input id="command-input" value={command} onChange={(e) => setCommand(e.target.value)} placeholder="e.g., session, scripts, help" className="bg-gray-800 border-gray-700 text-gray-100" onKeyDown={(e) => e.key === 'Enter' && sendCommand()} /><Button onClick={sendCommand} disabled={commandLoading || !command.trim()}>{commandLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button></div>
              </div>
              {commandResult && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Result</Label>
                  <Textarea value={commandResult} readOnly className="min-h-[200px] font-mono text-sm bg-gray-800 border-gray-700 text-gray-100" />
                </div>
              )}
              <Alert className="bg-blue-950 border-blue-800"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-blue-200 text-sm">Common commands: session, scripts, help, builds, uploads, perks</AlertDescription></Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}