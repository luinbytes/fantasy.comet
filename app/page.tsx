"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Key, AlertCircle, User, Loader2, Eye, EyeOff } from "lucide-react"
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

// Define a more precise interface for the UserInfo object.
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

const API_BASE_URL = "https://constelia.ai/api.php"

export default function ConstellaControlApp() {
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loadingUserInfo, setLoadingUserInfo] = useState(false)
  const [activeCategory, setActiveCategory] = useState("scripts")
  const [isBuddyModeEnabled, setIsBuddyModeEnabled] = useState(false)
  const { toast } = useToast()

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

  // Centralized API request handler for consistency.
  const API_KEY_REGEX = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

  const handleApiRequest = useCallback(async (params: Record<string, string>) => {
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
    const urlParams = new URLSearchParams({ key: apiKey, ...params })
    const url = `${API_BASE_URL}?${urlParams.toString()}`

    try {
      const res = await fetch(url)
      const responseText = await res.text()
      if (!res.ok) throw new Error(responseText || `HTTP ${res.status}`)
      
      const preMatch = responseText.match(/<pre>([\s\S]*?)<\/pre>/)
      return preMatch ? preMatch[1].trim() : responseText.trim()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      toast({ title: "API Error", description: errorMessage, variant: "destructive" })
      return null
    }
  }, [apiKey, toast])

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
    const result = await handleApiRequest({ cmd: "getMember", flags: "scripts&xp&beautify&bans&rolls&uploads&bonks" })
    if (result) {
      try {
        const data = JSON.parse(result)
        if (data.error || data.message) {
          throw new Error(data.error || data.message)
        }
        setUserInfo(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to parse user data."
        toast({ title: "Error", description: errorMessage, variant: "destructive" })
        setUserInfo(null)
      }
    }
    setLoadingUserInfo(false)
  }, [apiKey, handleApiRequest, toast])

  useEffect(() => {
    fetchUserInfo()
  }, [fetchUserInfo])

  const saveApiKey = () => {
    if (apiKey) {
      localStorage.setItem("constelia-api-key", apiKey)
      toast({ title: "API Key Saved", description: "Your API key has been saved locally." })
      fetchUserInfo() // Re-fetch user info with the new key
    }
  }

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
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent animate-pulse-custom">
            Fantasy.Comet2
          </h1>
          <p className="text-gray-400 mt-2">Unlock your gaming potential! Explore powerful tools, enhance your gameplay, and dominate the competition.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <aside className="lg:col-span-1 space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-200">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Sidebar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
              </CardContent>
            </Card>
            {userInfo ? (
              <UserInfoDisplay userInfo={userInfo} apiKey={apiKey} handleApiRequest={handleApiRequest} />
            ) : loadingUserInfo ? (
              <UserInfoSkeleton />
            ) : (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-gray-100"><Key className="h-5 w-5" />API Key</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-3">
                    <Label htmlFor="api-key" className="text-gray-300">License Key</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input id="api-key" type={showApiKey ? "text" : "password"} placeholder="Enter your Constelia license key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="bg-gray-800 border-gray-700 text-gray-100 pr-10 h-9" />
                        <Button variant="ghost" size="sm" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-1 top-1 h-7 w-7 text-gray-400 hover:text-gray-200">{showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                      </div>
                      <Button onClick={saveApiKey} variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent h-9">Save</Button>
                    </div>
                  </div>
                  <Alert><AlertCircle className="h-4 w-4" /><AlertDescription className="text-sm">Your API key is stored locally and only sent to Constelia.ai.</AlertDescription></Alert>
                </CardContent>
              </Card>
            )}
          </aside>
          <section className="lg:col-span-4">{renderDashboard()}</section>
        </div>
      </main>
    </div>
  )
}