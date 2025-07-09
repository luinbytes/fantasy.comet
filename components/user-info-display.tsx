"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Shield, Star, Calendar, Key } from "lucide-react"
import { getKeyName } from "@/utils/keycodes"

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
  last_roll?: number
}

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"

interface UserInfoDisplayProps {
  userInfo: UserInfo
  apiKey: string
  handleApiRequest: (params: Record<string, string>) => Promise<string | null>
}

export function UserInfoDisplay({ userInfo, apiKey, handleApiRequest }: UserInfoDisplayProps) {
  const { toast } = useToast()
  const [rolling, setRolling] = useState(false)

  const getProtectionLevel = (level: number, name?: string) => {
    if (name) return name
    const levels = {
      0: "Standard (Usermode)",
      1: "IPC/Zombie",
      2: "Kernel Mode",
      3: "Minimum (Usermode)",
      4: "Minimum (Kernel)",
    }
    return levels[level] || "Unknown"
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown"
    return new Date(Number.parseInt(dateString) * 1000).toLocaleDateString()
  }

  const handleRollLoot = async () => {
    setRolling(true)
    const result = await handleApiRequest({ cmd: "rollLoot" })
    if (result) {
      try {
        const data = JSON.parse(result)
        if (data.status === 200) {
          toast({ title: "Loot Rolled!", description: data.message })
        } else {
          toast({ title: "Roll Failed", description: data.message, variant: "destructive" })
        }
      } catch (error) {
        toast({ title: "Roll Failed", description: "Failed to parse roll response.", variant: "destructive" })
      }
    }
    setRolling(false)
  }

  const lastRollTime = userInfo.last_roll ? userInfo.last_roll * 1000 : 0
  const twentyFourHours = 24 * 60 * 60 * 1000
  const timeSinceLastRoll = Date.now() - lastRollTime
  const canRoll = timeSinceLastRoll >= twentyFourHours
  const timeUntilNextRoll = twentyFourHours - timeSinceLastRoll

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    return `${hours}h ${minutes}m ${seconds}s`
  }

  // Safely handle groups - ensure it's always an array
  const groups = Array.isArray(userInfo.groups) ? userInfo.groups : userInfo.groups ? [userInfo.groups] : []

  // Determine user level badge
  const getLevelBadge = (level: number, buddy?: number) => {
    if (buddy === 1) return { text: "Buddy", color: "bg-blue-600" }
    if (level >= 3) return { text: "VIP", color: "bg-purple-600" }
    if (level >= 2) return { text: "Veteran", color: "bg-green-600" }
    return { text: "Member", color: "bg-gray-600" }
  }

  const levelBadge = getLevelBadge(userInfo.level, userInfo.buddy)

  return (
    <Card className="w-full bg-gray-900 border-gray-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-100">
          <User className="h-5 w-5" />
          User Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={userInfo.avatar} alt={userInfo.username} referrerPolicy="no-referrer" />
            <AvatarFallback>
              {userInfo.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2 flex-1 min-w-0">
            <h3 className="font-semibold text-gray-100 truncate">{userInfo.username}</h3>
            {userInfo.custom_title && <p className="text-sm text-purple-400 truncate">{userInfo.custom_title}</p>}
            <div className="flex gap-1 flex-wrap">
              <Badge variant="secondary" className="bg-gray-800 text-gray-300 text-xs flex-shrink-0">
                Level {userInfo.level}
              </Badge>
              <Badge className={`${levelBadge.color} text-white text-xs flex-shrink-0`}>{levelBadge.text}</Badge>
              
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-300">
              <Shield className="h-4 w-4" />
              <span>Protection: {getProtectionLevel(userInfo.protection, userInfo.protection_name)}</span>
            </div>
            {userInfo.score !== undefined && (
              <div className="flex items-center gap-2 text-gray-300">
                <Star className="h-4 w-4" />
                <span>Score: {userInfo.score.toLocaleString()}</span>
              </div>
            )}
            {userInfo.xp !== undefined && (
              <div className="flex items-center gap-2 text-gray-300">
                <Star className="h-4 w-4" />
                <span>XP: {userInfo.xp.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {userInfo.register_date && (
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="h-4 w-4" />
                <span>Joined: {formatDate(userInfo.register_date)}</span>
              </div>
            )}
            {userInfo.posts !== undefined && (
              <div className="text-gray-300">Posts: {userInfo.posts.toLocaleString()}</div>
            )}
            {userInfo.discord && <div className="text-gray-300">Discord ID: {userInfo.discord}</div>}
          </div>
        </div>

        {(userInfo.key_link || userInfo.key_stop) && (
          <div className="pt-2 border-t border-gray-800">
            <div className="flex items-center gap-2 text-gray-300 mb-2">
              <Key className="h-4 w-4" />
              <span className="font-medium">Hotkeys</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
              <div>Link Key: {getKeyName(userInfo.key_link)}</div>
              <div>Stop Key: {getKeyName(userInfo.key_stop)}</div>
            </div>
          </div>
        )}

        {userInfo.steam && userInfo.steam.length > 0 && (
          <div className="pt-2 border-t border-gray-800">
            <p className="text-sm text-gray-300">Steam Accounts: {userInfo.steam.length}</p>
          </div>
        )}

        {userInfo.scripts && userInfo.scripts.length > 0 && (
          <div className="pt-2 border-t border-gray-800">
            <p className="text-sm text-gray-300">Active Scripts: {userInfo.scripts.length}</p>
          </div>
        )}

        <div className="pt-2 border-t border-gray-800">
          <div className="flex items-center gap-2 text-gray-300 mb-2">
            <Star className="h-4 w-4" />
            <span className="font-medium">Loot Roll</span>
          </div>
          <Button
            onClick={handleRollLoot}
            disabled={!canRoll || rolling}
            className="w-full"
          >
            {rolling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Roll Loot"}
          </Button>
          {!canRoll && (
            <p className="text-sm text-gray-400 mt-2">
              Next roll in: {formatTime(timeUntilNextRoll)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
