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

// Define interfaces for better type-safety and code clarity.
interface Perk {
  id: number
  name: string
  description: string
  cost: number
  owned: boolean
}

interface DivinityChart {
  leaderboard?: any[]
  user_info?: any
}

interface VenusStatus {
  status: string
  paired_with?: string
  pending?: boolean
}

interface PerksDashboardProps {
  apiKey: string;
  handleApiRequest: (params: Record<string, string>) => Promise<string | null>;
}

const API_BASE_URL = "https://constelia.ai/api.php"

export function PerksDashboard({ apiKey, handleApiRequest }: PerksDashboardProps) {
  const [perks, setPerks] = useState<Perk[]>([])
  const [divinityChart, setDivinityChart] = useState<DivinityChart | null>(null)
  const [venusStatus, setVenusStatus] = useState<VenusStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [perkId, setPerkId] = useState("")
  const [venusPartner, setVenusPartner] = useState("")
  const [lootResult, setLootResult] = useState<any>(null)
  const { toast } = useToast()

  

  const fetchPerks = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await handleApiRequest({ cmd: "listPerks" })
    if (result) {
      try {
        const data = JSON.parse(result)
        if (Array.isArray(data)) setPerks(data)
        else if (data.error) setError(data.error)
        else setError("Unexpected data format for perks.")
      } catch { setError("Failed to parse perks data.") }
    }
    setLoading(false)
  }, [handleApiRequest])

  const fetchDivinityChart = useCallback(async () => {
    const result = await handleApiRequest({ cmd: "getDivinityChart" })
    if (result) {
      try { setDivinityChart(JSON.parse(result)) } catch { console.error("Failed to parse divinity chart") }
    }
  }, [handleApiRequest])

  const manageVenus = useCallback(async (action: string, partner?: string) => {
    const params: Record<string, string> = { cmd: "changeVenus" }
    params[action] = partner || ""
    const result = await handleApiRequest(params)
    if (result) {
      if (action === "status") {
        try { setVenusStatus(JSON.parse(result)) } catch { setVenusStatus({ status: result }) }
      } else {
        toast({ title: "Venus Action", description: result })
        manageVenus("status") // Refresh status
      }
    }
  }, [handleApiRequest, toast])

  useEffect(() => {
    if (apiKey) {
      fetchPerks()
      fetchDivinityChart()
      manageVenus("status")
    }
  }, [apiKey, fetchPerks, fetchDivinityChart, manageVenus])

  const buyPerk = async (id: number) => {
    const result = await handleApiRequest({ cmd: "buyPerk", id: id.toString() })
    if (result !== null) {
      toast({ title: "Success", description: "Perk purchased successfully!" })
      fetchPerks()
    }
  }

  const respecPerks = async () => {
    const result = await handleApiRequest({ cmd: "respecPerks" })
    if (result !== null) {
      toast({ title: "Success", description: "Perks have been reset." })
      fetchPerks()
    }
  }

  const rollLoot = async () => {
    const result = await handleApiRequest({ cmd: "rollLoot" })
    if (result) {
      try {
        const data = JSON.parse(result)
        setLootResult(data)
        toast({ title: "Loot Rolled!", description: data.message || "Successfully rolled for loot." })
      } catch (error) {
        setLootResult({ message: result })
        toast({ title: "Roll Failed", description: "Failed to parse roll response.", variant: "destructive" })
      }
    } else {
      toast({ title: "Roll Failed", description: "No response from API.", variant: "destructive" })
    }
  }

  if (!apiKey) {
    return <Card className="bg-gray-900 border-gray-800"><CardContent className="pt-6"><div className="text-center text-gray-400"><Star className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Enter your API key to view perks</p></div></CardContent></Card>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-100">Perks & XP Dashboard</h2><p className="text-gray-400">Manage your perks, XP, and special abilities</p></div>
        <div className="flex gap-2">
          <Button onClick={fetchPerks} variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" className="border-red-700 text-red-300 hover:bg-red-900 bg-transparent"><RotateCcw className="h-4 w-4 mr-2" />Respec (-3000 XP)</Button></AlertDialogTrigger>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will cost 3000 XP and remove all your perks. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={respecPerks}>Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><Star className="h-5 w-5" />Available Perks</CardTitle></CardHeader>
            <CardContent>
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
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="text-gray-100">Quick Purchase</CardTitle></CardHeader>
            <CardContent className="space-y-4"><div className="flex gap-2"><Input type="number" value={perkId} onChange={(e) => setPerkId(e.target.value)} placeholder="Perk ID" className="bg-gray-800 border-gray-700 text-gray-100" /><Button onClick={() => perkId && buyPerk(Number.parseInt(perkId))} disabled={!perkId}>Buy</Button></div></CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {divinityChart && <Card className="bg-gray-900 border-gray-800"><CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><Trophy className="h-5 w-5" />Divinity Chart</CardTitle></CardHeader><CardContent><div className="text-sm text-gray-300"><p>XP Leaderboard and divine progression tracking</p>{divinityChart.user_info && <div className="mt-2 p-2 bg-gray-800 rounded"><pre className="text-xs">{JSON.stringify(divinityChart.user_info, null, 2)}</pre></div>}</div></CardContent></Card>}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><Heart className="h-5 w-5" />Venus Perk</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {venusStatus && <Alert className="bg-pink-950 border-pink-800"><Heart className="h-4 w-4" /><AlertDescription className="text-pink-200">Status: {venusStatus.status}{venusStatus.paired_with && ` | Paired with: ${venusStatus.paired_with}`}</AlertDescription></Alert>}
              <div className="flex gap-2"><Input value={venusPartner} onChange={(e) => setVenusPartner(e.target.value)} placeholder="Partner username" className="bg-gray-800 border-gray-700 text-gray-100" /><Button onClick={() => manageVenus("request", venusPartner)} disabled={!venusPartner} size="sm" className="bg-pink-600 hover:bg-pink-700 text-white">Request</Button></div>
              <div className="flex gap-2"><Button onClick={() => manageVenus("status")} variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent">Check Status</Button><Button onClick={() => manageVenus("withdraw")} variant="outline" size="sm" className="border-red-700 text-red-300 hover:bg-red-900 bg-transparent">Withdraw</Button></div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="flex items-center gap-2 text-gray-100"><Dice6 className="h-5 w-5" />Abundance of Jupiter</CardTitle></CardHeader>
            <CardContent className="space-y-4"><Button onClick={rollLoot} className="w-full"><Gift className="h-4 w-4 mr-2" />Roll Loot</Button>{lootResult && <div className="p-3 bg-gray-800 rounded"><pre className="text-xs text-gray-300">{JSON.stringify(lootResult, null, 2)}</pre></div>}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}