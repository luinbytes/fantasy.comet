"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Users, Eye, EyeOff, Key, AlertCircle } from "lucide-react"
import { getKeyName, VK_CODES } from "@/utils/keycodes"
import { useToast } from "@/hooks/use-toast"

// Define interfaces for better type-safety and code clarity.
interface MemberDashboardProps {
  apiKey: string;
  steamAccounts?: { [key: string]: { id: string; name: string; persona: string; time: number } }[];
  isBuddyModeEnabled: boolean;
  keyLink?: number;
  keyStop?: number;
  bans?: any;
  rolls?: any[];
  uploads?: any[];
  bonks?: any[];
  handleApiRequest: (params: Record<string, string>) => Promise<string | null>;
}

interface BuddyInfo {
  error?: string
  [key: string]: any
}

const API_BASE_URL = "https://constelia.ai/api.php"

export function MemberDashboard({ apiKey, steamAccounts, isBuddyModeEnabled, keyLink, keyStop, bans, rolls, uploads, bonks, handleApiRequest }: MemberDashboardProps) {
  console.log("MemberDashboard props:", { bans, rolls, uploads, bonks });
  const [buddyName, setBuddyName] = useState("")
  const [buddyInfo, setBuddyInfo] = useState<BuddyInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedSteamAccount, setSelectedSteamAccount] = useState("")
  const [linkKey, setLinkKey] = useState(keyLink ? keyLink.toString() : "")
  const [stopKey, setStopKey] = useState(keyStop ? keyStop.toString() : "")
  const [listeningForKey, setListeningForKey] = useState<"link" | "stop" | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (listeningForKey) {
        e.preventDefault()
        if (listeningForKey === "link") {
          setLinkKey(e.keyCode.toString())
        } else if (listeningForKey === "stop") {
          setStopKey(e.keyCode.toString())
        }
        setListeningForKey(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [listeningForKey])
  const { toast } = useToast()

  

  const getBuddyInfo = async () => {
    if (!isBuddyModeEnabled || !buddyName.trim()) return
    setLoading(true)
    setBuddyInfo(null)
    const result = await handleApiRequest({ cmd: "getMemberAsBuddy", name: buddyName })
    if (result) {
      try {
        setBuddyInfo(JSON.parse(result))
      } catch {
        setBuddyInfo({ error: result })
      }
    }
    setLoading(false)
  }

  const manageSteamAccount = async (action: "hide" | "show") => {
    if (!selectedSteamAccount) return
    const cmd = action === "hide" ? "hideSteamAccount" : "showSteamAccount"
    const result = await handleApiRequest({ cmd, name: selectedSteamAccount })
    if (result !== null) {
      toast({ title: "Success", description: `Steam account ${action}d successfully!` })
      setSelectedSteamAccount("")
    }
  }

  const setKeys = async () => {
    if (!linkKey && !stopKey) return
    const params: Record<string, string> = { cmd: "setKeys" }
    if (linkKey) params.link = linkKey
    if (stopKey) params.stop = stopKey

    const result = await handleApiRequest(params)
    if (result !== null) {
      toast({ title: "Success", description: "Keys updated successfully!" })
    }
  }

  if (!apiKey) {
    return (
      <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="text-center text-gray-400"><Users className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Enter your API key to access member features</p></div></CardContent></Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold text-gray-100">Member Management</h2><p className="text-gray-400">Manage buddy system, Steam accounts, and hotkeys</p></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {isBuddyModeEnabled && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><Users className="h-5 w-5" />Buddy System</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-950 border-blue-800"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-blue-200 text-sm">Requires Buddy or VIP status. Only works on Level 1 members.</AlertDescription></Alert>
                <div className="space-y-2">
                  <Label htmlFor="buddy-name" className="text-gray-300">Member Username</Label>
                  <div className="flex gap-2"><Input id="buddy-name" value={buddyName} onChange={(e) => setBuddyName(e.target.value)} placeholder="Enter member username" className="bg-gray-800 border-gray-700 text-gray-100" /><Button onClick={getBuddyInfo} disabled={loading || !buddyName.trim()} className="bg-purple-600 hover:bg-purple-700 text-white">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get Info"}</Button></div>
                </div>
                {buddyInfo && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Member Information</Label>
                    <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg max-h-64 overflow-y-auto">
                      {buddyInfo.error ? <p className="text-red-400">{buddyInfo.error}</p> : <pre className="text-sm text-gray-100 whitespace-pre-wrap">{JSON.stringify(buddyInfo, null, 2)}</pre>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><Eye className="h-5 w-5" />Steam Account Visibility</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="steam-account" className="text-gray-300">Steam Account</Label>
                <Select value={selectedSteamAccount} onValueChange={setSelectedSteamAccount}>
                  <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-gray-100">
                    <SelectValue placeholder="Select a Steam account" />
                  </SelectTrigger>
                  <SelectContent>
                    {steamAccounts && Object.values(steamAccounts).map((account: any) => (
                      <SelectItem key={account.id} value={account.name}>
                        {account.persona} ({account.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => manageSteamAccount("hide")} disabled={!selectedSteamAccount} variant="outline" className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"><EyeOff className="h-4 w-4 mr-2" />Hide Account</Button>
                <Button onClick={() => manageSteamAccount("show")} disabled={!selectedSteamAccount} variant="outline" className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"><Eye className="h-4 w-4 mr-2" />Show Account</Button>
              </div>
            </CardContent>
          </Card>
          {bans && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><AlertCircle className="h-5 w-5" />VAC/Game Ban Status</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-gray-300">VAC Banned: <span className="font-semibold">{bans.vacBanned ? "Yes" : "No"}</span></p>
                <p className="text-gray-300">Game Banned: <span className="font-semibold">{bans.gameBanned ? "Yes" : "No"}</span></p>
                {bans.daysSinceLastBan !== undefined && (
                  <p className="text-gray-300">Days Since Last Ban: <span className="font-semibold">{bans.daysSinceLastBan}</span></p>
                )}
              </CardContent>
            </Card>
          )}
          {rolls && rolls.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><Key className="h-5 w-5" />Loot History</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {rolls.map((roll: any, index: number) => (
                  <div key={index} className="text-sm text-gray-300 border-b border-gray-700 pb-1 last:border-b-0">
                    <p>Item: <span className="font-semibold">{roll.item}</span></p>
                    <p>Date: <span className="font-semibold">{new Date(roll.date * 1000).toLocaleString()}</span></p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {uploads && uploads.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><Upload className="h-5 w-5" />Upload History</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {uploads.map((upload: any, index: number) => (
                  <div key={index} className="text-sm text-gray-300 border-b border-gray-700 pb-1 last:border-b-0">
                    <p>URL: <a href={upload.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{upload.url}</a></p>
                    <p>Date: <span className="font-semibold">{new Date(upload.date * 1000).toLocaleString()}</span></p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {bonks && bonks.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><Key className="h-5 w-5" />Bonk History</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {bonks.map((bonk: any, index: number) => (
                  <div key={index} className="text-sm text-gray-300 border-b border-gray-700 pb-1 last:border-b-0">
                    <p>Reason: <span className="font-semibold">{bonk.reason}</span></p>
                    <p>Date: <span className="font-semibold">{new Date(bonk.date * 1000).toLocaleString()}</span></p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><Key className="h-5 w-5" />Hotkey Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="link-key" className="text-gray-300">Link Key</Label>
                  <div className="flex gap-2 items-center">
                    <Button onClick={() => setListeningForKey("link")} disabled={listeningForKey === "link"} variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent w-24">
                      {listeningForKey === "link" ? "Listening..." : "Set Key"}
                    </Button>
                    {linkKey ? (
                      <p className="text-sm text-gray-400">{getKeyName(Number.parseInt(linkKey))}</p>
                    ) : (
                      <p className="text-sm text-gray-500">No key set</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stop-key" className="text-gray-300">Stop/Panic Key</Label>
                  <div className="flex gap-2 items-center">
                    <Button onClick={() => setListeningForKey("stop")} disabled={listeningForKey === "stop"} variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent w-24">
                      {listeningForKey === "stop" ? "Listening..." : "Set Key"}
                    </Button>
                    {stopKey ? (
                      <p className="text-sm text-gray-400">{getKeyName(Number.parseInt(stopKey))}</p>
                    ) : (
                      <p className="text-sm text-gray-500">No key set</p>
                    )}
                  </div>
                </div>
                <Button onClick={setKeys} disabled={!linkKey && !stopKey} className="w-full"><Key className="h-4 w-4 mr-2" />Update Keys</Button>
              </div>
              <Alert className="bg-blue-950 border-blue-800"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-blue-200 text-sm">Common keys: F1-F12 (112-123), Ctrl (17), Alt (18), Shift (16)</AlertDescription></Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}