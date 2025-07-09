"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Key, AlertCircle, User, Loader2, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { UserInfoDisplay } from "@/components/user-info-display"
import { UserInfoSkeleton } from "@/components/user-info-skeleton"
import { SoftwareDashboard } from "@/components/software-dashboard"
import { ScriptsDashboard } from "@/components/scripts-dashboard"
import { ConfigDashboard } from "@/components/config-dashboard"
import { ApiTestDashboard } from "@/components/api-test-dashboard"
import { ForumDashboard } from "@/components/forum-dashboard"
import { PerksDashboard } from "@/components/perks-dashboard"

import { MemberDashboard } from "@/components/member-dashboard"
import { SettingsDashboard } from "@/components/settings-dashboard"
import { useToast } from "@/hooks/use-toast"

import { callApi } from "@/lib/api";

/**
 * @interface UserInfo
 * @description Defines the structure for user information retrieved from the API.
 * @property {string} username - The user's username.
 * @property {number} level - The user's level.
 * @property {number} protection - The user's protection level.
 * @property {string} [protection_name] - The name of the protection level.
 * @property {string} [register_date] - The user's registration date.
 * @property {number} [posts] - The number of posts made by the user.
 * @property {number} [score] - The user's score.
 * @property {string} [custom_title] - The user's custom title.
 * @property {string[] | string} [groups] - The user's groups.
 * @property {string} [avatar] - URL to the user's avatar.
 * @property {number} [xp] - The user's experience points.
 * @property {number} [buddy] - Buddy status.
 * @property {number} [discord] - Discord ID.
 * @property {number} [key_link] - Link key.
 * @property {number} [key_stop] - Stop key.
 * @property {any[]} [steam] - Array of Steam accounts.
 * @property {any[]} [scripts] - Array of scripts.
 * @property {any} [bans] - Ban information.
 * @property {any[]} [rolls] - Loot roll history.
 * @property {any[]} [uploads] - Upload history.
 * @property {any[]} [bonks] - Bonk history.
 * @property {number} [last_roll] - Timestamp of the last loot roll.
 */
interface UserInfo {
  username: string
  level: number
  protection: number
  protection_name?: string
  register_date?: string
  posts?: number
  score?: number
  custom_title?: string
  groups?: string[] | string
  avatar?: string
  xp?: number
  buddy?: number
  discord?: number
  key_link?: number
  key_stop?: number
  steam?: any[]
  scripts?: any[]
  bans?: any
  rolls?: any[]
  uploads?: any[]
  bonks?: any[]
  last_roll?: number
}

/**
 * @function ConstellaControlApp
 * @description The main application component for Fantasy.Comet2.
 * Manages API key, user information, navigation, and displays various dashboards.
 * @returns {JSX.Element} The main application UI.
 */
export default function ConstellaControlApp() {
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loadingUserInfo, setLoadingUserInfo] = useState(false)
  const [activeCategory, setActiveCategory] = useState("scripts")
  const [isBuddyModeEnabled, setIsBuddyModeEnabled] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const { toast } = useToast()

  /**
   * @description Loads saved API key and buddy mode setting from local storage on component mount.
   */
  useEffect(() => {
    const savedKey = localStorage.getItem("constelia-api-key")
    if (savedKey) {
      setApiKey(savedKey)
    }
    const savedBuddyMode = localStorage.getItem("buddy-mode")
    if (savedBuddyMode) {
      setIsBuddyModeEnabled(JSON.parse(savedBuddyMode))
    }
  }, [])

  /**
   * @constant API_KEY_REGEX
   * @description Regular expression to validate the format of the API key.
   */
  const API_KEY_REGEX = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

  /**
   * @function handleApiRequest
   * @description Centralized handler for all API requests.
   * Validates the API key, calls the `callApi` utility, and handles generic errors.
   * @param {Record<string, any>} params - Query parameters for the API request.
   * @param {"GET" | "POST"} [method="GET"] - HTTP method for the request.
   * @param {Record<string, any>} [postData] - Data to be sent in the request body for POST requests.
   * @returns {Promise<any | null>} The API response data or null if an error occurred.
   */
  const handleApiRequest = useCallback(async (params: Record<string, any>, method: "GET" | "POST" = "GET", postData?: Record<string, any>) => {
    if (!apiKey) {
      console.log("handleApiRequest: No API key, returning null.");
      return null;
    }
    if (!API_KEY_REGEX.test(apiKey)) {
      console.log("handleApiRequest: Invalid API key format, returning null.");
      toast({ title: "API Key Format Error", description: "API Key must be in the format ABCD-EFGH-IJLK-MNLO.", variant: "destructive" });
      return null;
    }
    console.log("handleApiRequest: Valid API key, proceeding with request.");

    const result = await callApi(apiKey, params, toast, method, postData);

    if (result && result.error) {
      return null;
    }
    return result;
  }, [apiKey, toast])

  /**
   * @function fetchUserInfo
   * @description Fetches user information from the API using the provided API key.
   * Updates the `userInfo` state and handles loading/error states.
   * @returns {Promise<void>}
   */
  const fetchUserInfo = useCallback(async () => {
    if (!apiKey) {
      console.log("fetchUserInfo: No API key, returning.");
      setUserInfo(null);
      return;
    }
    if (!API_KEY_REGEX.test(apiKey)) {
      console.log("fetchUserInfo: Invalid API key format, returning.");
      setUserInfo(null);
      toast({ title: "API Key Format Error", description: "API Key must be in the format ABCD-EFGH-IJLK-MNLO.", variant: "destructive" });
      return;
    }
    console.log("fetchUserInfo: Valid API key, proceeding to fetch.");
    setLoadingUserInfo(true)
    const result = await handleApiRequest({ cmd: "getMember", scripts: "1", xp: "1", beautify: "1", bans: "1", rolls: "1", uploads: "1", bonks: "1" })
    if (result) {
      try {
        if (result.error || result.message) {
          throw new Error(result.error || result.message)
        }
        setUserInfo(result)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to parse user data."
        toast({ title: "Error", description: errorMessage, variant: "destructive" })
        setUserInfo(null)
      }
    }
    setLoadingUserInfo(false)
  }, [apiKey, handleApiRequest, toast])

  /**
   * @description Fetches user information on component mount and whenever `fetchUserInfo` changes.
   */
  useEffect(() => {
    fetchUserInfo()
  }, [fetchUserInfo])

  /**
   * @function saveApiKey
   * @description Saves the current API key to local storage and re-fetches user information.
   * @returns {void}
   */
  const saveApiKey = () => {
    if (apiKey) {
      localStorage.setItem("constelia-api-key", apiKey)
      toast({ title: "API Key Saved", description: "Your API key has been saved locally." })
      fetchUserInfo()
    }
  }

  /**
   * @function renderDashboard
   * @description Renders the active dashboard component based on the `activeCategory` state.
   * @returns {JSX.Element} The dashboard component to display.
   */
  const renderDashboard = () => {
    switch (activeCategory) {
      case "scripts": return <ScriptsDashboard apiKey={apiKey} handleApiRequest={handleApiRequest} isActive={activeCategory === "scripts"} />
      case "member": return <MemberDashboard apiKey={apiKey} steamAccounts={userInfo?.steam} isBuddyModeEnabled={isBuddyModeEnabled} keyLink={userInfo?.key_link} keyStop={userInfo?.key_stop} bans={userInfo?.bans} rolls={userInfo?.rolls} uploads={userInfo?.uploads} bonks={userInfo?.bonks} handleApiRequest={handleApiRequest} />
      case "software": return <SoftwareDashboard apiKey={apiKey} handleApiRequest={handleApiRequest} />
      case "config": return <ConfigDashboard apiKey={apiKey} handleApiRequest={handleApiRequest} />
      case "forum": return <ForumDashboard apiKey={apiKey} handleApiRequest={handleApiRequest} />
      case "perks": return <PerksDashboard apiKey={apiKey} handleApiRequest={handleApiRequest} />
      case "test": return <ApiTestDashboard apiKey={apiKey} handleApiRequest={handleApiRequest} />
      case "settings": return <SettingsDashboard onBuddyToggle={setIsBuddyModeEnabled} handleApiRequest={handleApiRequest} />
      default: return <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><p className="text-center text-gray-400">Dashboard for {activeCategory} coming soon!</p></CardContent></Card>
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Button to toggle sidebar collapse state */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="fixed top-4 left-4 z-50 h-8 w-8 p-0"
      >
        {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Sidebar navigation area */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 ease-in-out flex-shrink-0 bg-gray-900 border-r border-gray-800 p-4 pt-16`}>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-200">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Sidebar activeCategory={activeCategory} onCategoryChange={setActiveCategory} isCollapsed={isSidebarCollapsed} />
          </CardContent>
        </Card>
      </aside>

      {/* Main content area, flexible to fill remaining space */}
      <div className="flex-1 flex flex-col">
        {/* Application header */}
        <header className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Fantasy.Comet2
            </h1>
            <p className="text-gray-400 text-sm">Unlock your gaming potential! Explore powerful tools, enhance your gameplay, and dominate the competition.</p>
          </div>
          {/* Section for user info display or API key input */}
          <div className="flex-shrink-0 ml-4">
            {userInfo ? (
              <UserInfoDisplay userInfo={userInfo} apiKey={apiKey} handleApiRequest={handleApiRequest} isCollapsed={false} variant="header" />
            ) : loadingUserInfo ? (
              <UserInfoSkeleton isCollapsed={false} variant="header" />
            ) : (
              <Card className="bg-gray-900 border-gray-800 flex-1 max-w-xs">
                <CardHeader className="pb-2 pt-2">
                  <CardTitle className="flex items-center gap-2 text-gray-100 text-base"><Key className="h-4 w-4" />API Key</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0 pb-2">
                  <div className="space-y-2">
                    <Label htmlFor="api-key" className="text-gray-300 text-xs">License Key</Label>
                    <div className="flex gap-1">
                      <div className="relative flex-1">
                        <Input id="api-key" type={showApiKey ? "text" : "password"} placeholder="Enter your Constelia license key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="bg-gray-800 border-gray-700 text-gray-100 pr-8 h-8 text-sm" />
                        <Button variant="ghost" size="sm" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-0 top-0 h-7 w-7 text-gray-400 hover:text-gray-200"><span className="sr-only">Toggle API Key visibility</span>{showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}</Button>
                      </div>
                      <Button onClick={saveApiKey} variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent h-8 text-sm">Save</Button>
                    </div>
                  </div>
                  <Alert className="p-2"><AlertCircle className="h-3 w-3" /><AlertDescription className="text-xs">Your API key is stored locally and only sent to Constelia.ai.</AlertDescription></Alert>
                </CardContent>
              </Card>
            )}
          </div>
        </header>

        {/* Main content area for dashboards */}
        <main className="flex-1 p-8 overflow-auto">
          {renderDashboard()}
        </main>
      </div>
    </div>
  )
}
