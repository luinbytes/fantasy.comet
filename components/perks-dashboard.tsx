"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Star, Gift, Trophy, Heart, Dice6, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

/**
 * @interface Perk
 * @description Defines the structure for a perk object.
 * @property {number} id - The unique identifier of the perk.
 * @property {string} name - The name of the perk.
 * @property {string} description - A description of what the perk does.
 * @property {number} cost - The XP cost to purchase the perk.
 * @property {boolean} owned - Indicates if the user already owns this perk.
 */
interface Perk {
  id: number
  name: string
  description: string
  cost: number
  owned: boolean
}

/**
 * @interface DivinityChart
 * @description Defines the structure for the Divinity Chart data.
 * @property {Array<any>} [leaderboard] - Optional leaderboard data.
 * @property {any} [user_info] - Optional user-specific information from the chart.
 */
interface DivinityChart {
  leaderboard?: any[]
  user_info?: any
}

/**
 * @interface VenusStatus
 * @description Defines the structure for the Venus perk status.
 * @property {string} status - The current status of the Venus perk (e.g., paired, pending).
 * @property {string} [paired_with] - The username of the member paired with, if applicable.
 * @property {boolean} [pending] - Indicates if there's a pending request, if applicable.
 */
interface VenusStatus {
  status: string
  paired_with?: string
  pending?: boolean
}

/**
 * @interface PerksDashboardProps
 * @description Props for the PerksDashboard component.
 * @property {string} apiKey - The API key for making requests.
 * @property {(params: Record<string, any>, method?: "GET" | "POST", postData?: Record<string, any>) => Promise<any | null>} handleApiRequest - Function to handle API requests.
 */
interface PerksDashboardProps {
  apiKey: string;
  handleApiRequest: (params: Record<string, any>, method?: "GET" | "POST", postData?: Record<string, any>) => Promise<any | null>;
}

/**
 * @component PerksDashboard
 * @description A dashboard component for managing user perks, XP, and special abilities like Divinity Chart and Venus perk.
 * @param {PerksDashboardProps} props - The props for the PerksDashboard component.
 * @returns {JSX.Element} The rendered PerksDashboard component.
 */
export function PerksDashboard({ apiKey, handleApiRequest }: PerksDashboardProps) {
  // State to store the list of available perks.
  const [perks, setPerks] = useState<Perk[]>([])
  // State to store the Divinity Chart data.
  const [divinityChart, setDivinityChart] = useState<DivinityChart | null>(null)
  // State to store the status of the Venus perk.
  const [venusStatus, setVenusStatus] = useState<VenusStatus | null>(null)
  // State to manage loading status during API calls.
  const [loading, setLoading] = useState(false)
  // State to store any error messages from API calls.
  const [error, setError] = useState<string | null>(null)
  // State to store the ID of the perk for quick purchase.
  const [perkId, setPerkId] = useState("")
  // State to store the username of the Venus partner.
  const [venusPartner, setVenusPartner] = useState("")
  // State to store the result of a loot roll.
  const [lootResult, setLootResult] = useState<any>(null)
  // Initialize toast hook for displaying notifications.
  const { toast } = useToast()

  /**
   * @function fetchPerks
   * @description Fetches the list of available perks from the API.
   */
  const fetchPerks = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await handleApiRequest({ cmd: "listPerks" })
    if (result) {
      if (Array.isArray(result)) setPerks(result) // result is already parsed JSON
      else if (result.error) setError(result.error)
      else setError("Unexpected data format for perks.")
    } else {
      setError("API call failed or returned no data.");
    }
    setLoading(false)
  }, [handleApiRequest])

  /**
   * @function fetchDivinityChart
   * @description Fetches the Divinity Chart data from the API.
   */
  const fetchDivinityChart = useCallback(async () => {
    const result = await handleApiRequest({ cmd: "getDivinityChart" })
    if (result) {
      setDivinityChart(result) // result is already parsed JSON
    }
  }, [handleApiRequest])

  /**
   * @function manageVenus
   * @description Manages actions related to the Venus perk (e.g., check status, request partner, withdraw).
   * @param {string} action - The action to perform (e.g., "status", "request", "withdraw").
   * @param {string} [partner] - Optional partner username for "request" action.
   */
  const manageVenus = useCallback(async (action: string, partner?: string) => {
    const params: Record<string, string> = { cmd: "changeVenus" }
    params[action] = partner || ""
    const result = await handleApiRequest(params)
    if (result) {
      if (action === "status") {
        if (typeof result === 'string') { // If it's raw text (e.g., "not an active Session")
          setVenusStatus({ status: result });
        } else { // If it's parsed JSON
          setVenusStatus(result);
        }
      } else {
        toast({ title: "Venus Action", description: result.message || JSON.stringify(result) }) // Use message if available
        manageVenus("status") // Refresh status
      }
    }
  }, [handleApiRequest, toast])

  /**
   * @function useEffect
   * @description Fetches initial data (perks, divinity chart, venus status) when the API key is available.
   */
  useEffect(() => {
    if (apiKey) {
      fetchPerks()
      fetchDivinityChart()
      manageVenus("status")
    }
  }, [apiKey, fetchPerks, fetchDivinityChart, manageVenus])

  /**
   * @function buyPerk
   * @description Purchases a perk using its ID.
   * @param {number} id - The ID of the perk to purchase.
   */
  const buyPerk = async (id: number) => {
    const result = await handleApiRequest({ cmd: "buyPerk", id: id.toString() })
    if (result) { // result is already parsed JSON
      toast({ title: "Success", description: "Perk purchased successfully!" })
      fetchPerks()
    }
  }

  /**
   * @function respecPerks
   * @description Resets all purchased perks, incurring an XP cost.
   */
  const respecPerks = async () => {
    const result = await handleApiRequest({ cmd: "respecPerks" })
    if (result) { // result is already parsed JSON
      toast({ title: "Success", description: "Perks have been reset." })
      fetchPerks()
    }
  }

  /**
   * @function rollLoot
   * @description Rolls for loot using the "Abundance of Jupiter" perk.
   */
  const rollLoot = async () => {
    const result = await handleApiRequest({ cmd: "rollLoot" })
    if (result) { // result is already parsed JSON
      setLootResult(result)
      toast({ title: "Loot Rolled!", description: result.message || "Successfully rolled for loot." })
    } else {
      toast({ title: "Roll Failed", description: "No response from API.", variant: "destructive" })
    }
  }

  // Display a message if no API key is provided, prompting the user to enter it.
  if (!apiKey) {
    return <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="text-center text-gray-400"><Star className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Enter your API key to view perks</p></div></CardContent></Card>
  }

  return (
    <div className="space-y-6">
      {/* Page header with title, description, and action buttons */}
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-100">Perks & XP Dashboard</h2><p className="text-gray-400">Manage your perks, XP, and special abilities</p></div>
        <div className="flex gap-2">
          {/* Refresh button to refetch perk data */}
          <Button onClick={fetchPerks} variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          {/* Alert dialog for respec perks confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" className="border-red-700 text-red-300 hover:bg-red-900 bg-transparent"><RotateCcw className="h-4 w-4 mr-2" />Respec (-3000 XP)</Button></AlertDialogTrigger>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will cost 3000 XP and remove all your perks. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={respecPerks}>Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Available Perks Card */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><Star className="h-5 w-5" />Available Perks</CardTitle></CardHeader>
            <CardContent>
              {/* Loading, error, or perk list display */}
              {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div> : error ? <Alert variant="destructive">{error}</Alert> : <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {perks.map((perk) => (
                  <Card key={perk.id} className="bg-gray-800 border-gray-700"><CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2"><h4 className="font-medium text-gray-100">{perk.name}</h4><div className="flex items-center gap-2"><Badge variant="outline" className="border-yellow-600 text-yellow-400">{perk.cost} XP</Badge>{perk.owned && <Badge className="bg-green-600 text-white">Owned</Badge>}</div></div>
                    <p className="text-sm text-gray-300 mb-3">{perk.description}</p>
                    <Button onClick={() => buyPerk(perk.id)} disabled={perk.owned} size="sm">{perk.owned ? "Owned" : "Purchase"}</Button>
                  </CardContent></Card>
                ))}
              </div>}
            </CardContent>
          </Card>
          {/* Quick Purchase Card */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="text-gray-100">Quick Purchase</CardTitle></CardHeader>
            <CardContent className="space-y-4"><div className="flex gap-2"><Input type="number" value={perkId} onChange={(e) => setPerkId(e.target.value)} placeholder="Perk ID" className="bg-gray-800 border-gray-700 text-gray-100" /><Button onClick={() => perkId && buyPerk(Number.parseInt(perkId))} disabled={!perkId}>Buy</Button></div></CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Divinity Chart Card - conditionally rendered if data is available */}
          {divinityChart && <Card className="bg-gray-900 border-gray-800"><CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><Trophy className="h-5 w-5" />Divinity Chart</CardTitle></CardHeader><CardContent><div className="text-sm text-gray-300"><p>XP Leaderboard and divine progression tracking</p>{divinityChart.user_info && <div className="mt-2 p-2 bg-gray-800 rounded"><pre className="text-xs">{JSON.stringify(divinityChart.user_info, null, 2)}</pre></div>}</div></CardContent></Card>}
          {/* Venus Perk Card */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><Heart className="h-5 w-5" />Venus Perk</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Venus status display */}
              {venusStatus && <Alert className="bg-pink-950 border-pink-800"><Heart className="h-4 w-4" /><AlertDescription className="text-pink-200">Status: {venusStatus.status}{venusStatus.paired_with && ` | Paired with: ${venusStatus.paired_with}`}</AlertDescription></Alert>}
              {/* Input for Venus partner username and Request button */}
              <div className="flex gap-2"><Input value={venusPartner} onChange={(e) => setVenusPartner(e.target.value)} placeholder="Partner username" className="bg-gray-800 border-gray-700 text-gray-100" /><Button onClick={() => manageVenus("request", venusPartner)} disabled={!venusPartner} size="sm" className="bg-pink-600 hover:bg-pink-700 text-white">Request</Button></div>
              {/* Buttons to check status or withdraw Venus request */}
              <div className="flex gap-2"><Button onClick={() => manageVenus("status")} variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent">Check Status</Button><Button onClick={() => manageVenus("withdraw")} variant="outline" size="sm" className="border-red-700 text-red-300 hover:bg-red-900 bg-transparent">Withdraw</Button></div>
            </CardContent>
          </Card>
          {/* Abundance of Jupiter (Loot Roll) Card */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><Dice6 className="h-5 w-5" />Abundance of Jupiter</CardTitle></CardHeader>
            <CardContent className="space-y-4"><Button onClick={rollLoot} className="w-full"><Gift className="h-4 w-4 mr-2" />Roll Loot</Button>{lootResult && <div className="p-3 bg-gray-800 rounded"><pre className="text-xs text-gray-300">{JSON.stringify(lootResult, null, 2)}</pre></div>}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}