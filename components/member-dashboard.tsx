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

/**
 * @interface MemberDashboardProps
 * @description Props for the MemberDashboard component.
 * @property {string} apiKey - The API key for making requests.
 * @property {Array<Object>} [steamAccounts] - List of Steam accounts associated with the member.
 * @property {boolean} isBuddyModeEnabled - Indicates if buddy mode is enabled.
 * @property {number} [keyLink] - The virtual key code for the link key.
 * @property {number} [keyStop] - The virtual key code for the stop/panic key.
 * @property {any} [bans] - Information about VAC/Game bans.
 * @property {Array<any>} [rolls] - History of loot rolls.
 * @property {Array<any>} [uploads] - History of file uploads.
 * @property {Array<any>} [bonks] - History of bonks received.
 * @property {(params: Record<string, any>, method?: "GET" | "POST", postData?: Record<string, any>) => Promise<any | null>} handleApiRequest - Function to handle API requests.
 */
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
  handleApiRequest: (params: Record<string, any>, method?: "GET" | "POST", postData?: Record<string, any>) => Promise<any | null>;
}

/**
 * @interface BuddyInfo
 * @description Interface for the information returned by the getMemberAsBuddy API call.
 * @property {string} [error] - Error message if the API call fails.
 * @property {any} [key: string] - Dynamic properties for member information.
 */
interface BuddyInfo {
  error?: string
  [key: string]: any
}

/**
 * @component MemberDashboard
 * @description A dashboard component for managing member-related features such as buddy system, Steam accounts, and hotkey configurations.
 * @param {MemberDashboardProps} props - The props for the MemberDashboard component.
 * @returns {JSX.Element} The rendered MemberDashboard component.
 */
export function MemberDashboard({ apiKey, steamAccounts, isBuddyModeEnabled, keyLink, keyStop, bans, rolls, uploads, bonks, handleApiRequest }: MemberDashboardProps) {
  // console.log("MemberDashboard props:", { bans, rolls, uploads, bonks }); // Log for debugging purposes, can be removed in production.
  const [buddyName, setBuddyName] = useState("") // State to store the username for buddy system lookups.
  const [buddyInfo, setBuddyInfo] = useState<BuddyInfo | null>(null) // State to store information about the looked-up buddy.
  const [loading, setLoading] = useState(false) // State to manage loading status during API calls.
  const [selectedSteamAccount, setSelectedSteamAccount] = useState("") // State to store the currently selected Steam account for management.
  const [linkKey, setLinkKey] = useState(keyLink ? keyLink.toString() : "") // State to store the virtual key code for the link key.
  const [stopKey, setStopKey] = useState(keyStop ? keyStop.toString() : "") // State to store the virtual key code for the stop/panic key.
  const [listeningForKey, setListeningForKey] = useState<"link" | "stop" | null>(null) // State to indicate if the component is listening for a key press.

  /**
   * @function useEffect
   * @description Handles global keydown events to capture hotkey presses for link and stop keys.
   * Prevents default behavior of the key press when listening for a key.
   */
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
  // Initialize toast hook for displaying notifications.
  const { toast } = useToast()

  /**
   * @function getBuddyInfo
   * @description Fetches information about a member using the "getMemberAsBuddy" API command.
   * This function is only available when buddy mode is enabled.
   */
  const getBuddyInfo = async () => {
    if (!isBuddyModeEnabled || !buddyName.trim()) return
    setLoading(true)
    setBuddyInfo(null)
    const result = await handleApiRequest({ cmd: "getMemberAsBuddy", name: buddyName })
    if (result) {
      if (result.error) { // Check for error property in the returned object
        setBuddyInfo({ error: result.error });
      } else {
        setBuddyInfo(result); // result is already parsed JSON
      }
    } else {
      setBuddyInfo({ error: "API call failed or returned no data." });
    }
    setLoading(false)
  }

  /**
   * @function manageSteamAccount
   * @description Hides or shows a Steam account using the "hideSteamAccount" or "showSteamAccount" API commands.
   * @param {"hide" | "show"} action - The action to perform: "hide" or "show".
   */
  const manageSteamAccount = async (action: "hide" | "show") => {
    if (!selectedSteamAccount) return
    const cmd = action === "hide" ? "hideSteamAccount" : "showSteamAccount"
    const result = await handleApiRequest({ cmd, name: selectedSteamAccount })
    if (result) { // result is already parsed JSON
      toast({ title: "Success", description: `Steam account ${action}d successfully!` })
      setSelectedSteamAccount("")
    }
  }

  /**
   * @function setKeys
   * @description Sets the link and/or stop hotkeys using the "setKeys" API command.
   */
  const setKeys = async () => {
    if (!linkKey && !stopKey) return
    const params: Record<string, string> = { cmd: "setKeys" }
    if (linkKey) params.link = linkKey
    if (stopKey) params.stop = stopKey

    const result = await handleApiRequest(params)
    if (result) { // result is already parsed JSON
      toast({ title: "Success", description: "Keys updated successfully!" })
    }
  }

  if (!apiKey) {
    // Display a message if no API key is provided, prompting the user to enter it.
    return (
      <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="text-center text-gray-400"><Users className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Enter your API key to access member features</p></div></CardContent></Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header with title and description */}
      <div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold text-gray-100">Member Management</h2><p className="text-gray-400">Manage buddy system, Steam accounts, and hotkeys</p></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Buddy System Card - conditionally rendered if buddy mode is enabled */}
          {isBuddyModeEnabled && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><Users className="h-5 w-5" />Buddy System</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Alert for buddy system requirements */}
                <Alert className="bg-blue-950 border-blue-800"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-blue-200 text-sm">Requires Buddy or VIP status. Only works on Level 1 members.</AlertDescription></Alert>
                {/* Input for member username and Get Info button */}
                <div className="space-y-2">
                  <Label htmlFor="buddy-name" className="text-gray-300">Member Username</Label>
                  <div className="flex gap-2"><Input id="buddy-name" value={buddyName} onChange={(e) => setBuddyName(e.target.value)} placeholder="Enter member username" className="bg-gray-800 border-gray-700 text-gray-100" /><Button onClick={getBuddyInfo} disabled={loading || !buddyName.trim()} className="bg-purple-600 hover:bg-purple-700 text-white">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get Info"}</Button></div>
                </div>
                {/* Display buddy information if available */}
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
          {/* Steam Account Visibility Card */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><Eye className="h-5 w-5" />Steam Account Visibility</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Select dropdown for Steam accounts */}
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
              {/* Buttons to hide or show selected Steam account */}
              <div className="flex gap-2">
                <Button onClick={() => manageSteamAccount("hide")} disabled={!selectedSteamAccount} variant="outline" className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"><EyeOff className="h-4 w-4 mr-2" />Hide Account</Button>
                <Button onClick={() => manageSteamAccount("show")} disabled={!selectedSteamAccount} variant="outline" className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"><Eye className="h-4 w-4 mr-2" />Show Account</Button>
              </div>
            </CardContent>
          </Card>
          {/* VAC/Game Ban Status Card - conditionally rendered if ban information is available */}
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
          {/* Loot History Card - conditionally rendered if loot roll information is available */}
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
          {/* Upload History Card - conditionally rendered if upload information is available */}
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
          {/* Bonk History Card - conditionally rendered if bonk information is available */}
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
          {/* Hotkey Configuration Card */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><Key className="h-5 w-5" />Hotkey Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {/* Link Key configuration */}
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
                {/* Stop/Panic Key configuration */}
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
                {/* Button to update keys */}
                <Button onClick={setKeys} disabled={!linkKey && !stopKey} className="w-full"><Key className="h-4 w-4 mr-2" />Update Keys</Button>
              </div>
              {/* Alert for common key codes */}
              <Alert className="bg-blue-950 border-blue-800"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-blue-200 text-sm">Common keys: F1-F12 (112-123), Ctrl (17), Alt (18), Shift (16)</AlertDescription></Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}