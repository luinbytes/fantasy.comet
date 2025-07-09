"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Shield, Star, Calendar, Key } from "lucide-react"
import { getKeyName } from "@/utils/keycodes"

/**
 * @interface UserInfo
 * @description Defines the structure for user information retrieved from the API.
 * @property {string} username - The user's username.
 * @property {number} level - The user's level.
 * @property {number} protection - The user's protection level ID.
 * @property {string} [protection_name] - The human-readable name of the protection level.
 * @property {string} [register_date] - The user's registration date (timestamp string).
 * @property {number} [posts] - The number of forum posts by the user.
 * @property {number} [score] - The user's score.
 * @property {string} [custom_title] - The user's custom title.
 * @property {string[] | string} [groups] - The user's groups, can be a string or array of strings.
 * @property {string} [avatar] - URL to the user's avatar.
 * @property {number} [xp] - The user's experience points.
 * @property {number} [buddy] - Indicates if the user is a buddy (1 if yes, 0 if no).
 * @property {number} [discord] - The user's Discord ID.
 * @property {number} [key_link] - Virtual key code for the link key.
 * @property {number} [key_stop] - Virtual key code for the stop/panic key.
 * @property {any[]} [steam] - Array of Steam accounts associated with the user.
 * @property {any[]} [scripts] - Array of scripts associated with the user.
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
  last_roll?: number
}

/**
 * @interface UserInfoDisplayProps
 * @description Props for the UserInfoDisplay component.
 * @property {UserInfo} userInfo - The user information to display.
 * @property {string} apiKey - The API key for making requests.
 * @property {(params: Record<string, string>) => Promise<string | null>} handleApiRequest - Function to handle API requests.
 * @property {boolean} isCollapsed - Indicates if the sidebar (and thus this component) is collapsed.
 * @property {"default" | "header"} [variant="default"] - The display variant of the component.
 */
interface UserInfoDisplayProps {
  userInfo: UserInfo
  apiKey: string
  handleApiRequest: (params: Record<string, string>) => Promise<string | null>
  isCollapsed: boolean
  variant?: "default" | "header"; // New prop
}

/**
 * @component UserInfoDisplay
 * @description Displays detailed information about a user, including their profile, stats, hotkeys, and loot roll status.
 * Can be displayed in a default or header variant, and adjusts layout based on a collapsed state.
 * @param {UserInfoDisplayProps} props - The props for the UserInfoDisplay component.
 * @returns {JSX.Element} The rendered UserInfoDisplay component.
 */
export function UserInfoDisplay({ userInfo, apiKey, handleApiRequest, isCollapsed, variant = "default" }: UserInfoDisplayProps) {
  // Initialize toast hook for displaying notifications.
  const { toast } = useToast()
  // State to manage the loading status of the loot roll.
  const [rolling, setRolling] = useState(false)

  /**
   * @function getProtectionLevel
   * @description Returns the human-readable name for a given protection level ID.
   * @param {number} level - The numeric protection level.
   * @param {string} [name] - Optional, pre-defined name for the protection level.
   * @returns {string} The human-readable protection level name.
   */
  const getProtectionLevel = (level: number, name?: string) => {
    if (name) return name
    const levels: { [key: number]: string } = {
      0: "Standard (Usermode)",
      1: "IPC/Zombie",
      2: "Kernel Mode",
      3: "Minimum (Usermode)",
      4: "Minimum (Kernel)",
    }
    return levels[level] || "Unknown"
  }

  /**
   * @function formatDate
   * @description Formats a Unix timestamp string into a localized date string.
   * @param {string} [dateString] - The Unix timestamp string.
   * @returns {string} The formatted date string or "Unknown" if input is invalid.
   */
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown"
    return new Date(Number.parseInt(dateString) * 1000).toLocaleDateString()
  }

  /**
   * @function handleRollLoot
   * @description Handles the loot roll action, making an API request and displaying toast notifications.
   */
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

  // Calculate time until next loot roll.
  const lastRollTime = userInfo.last_roll ? userInfo.last_roll * 1000 : 0
  const twentyFourHours = 24 * 60 * 60 * 1000
  const timeSinceLastRoll = Date.now() - lastRollTime
  const canRoll = timeSinceLastRoll >= twentyFourHours
  const timeUntilNextRoll = twentyFourHours - timeSinceLastRoll

  /**
   * @function formatTime
   * @description Formats a duration in milliseconds into a human-readable string (e.g., "1h 30m 15s").
   * @param {number} ms - The duration in milliseconds.
   * @returns {string} The formatted time string.
   */
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    return `${hours}h ${minutes}m ${seconds}s`
  }

  // Safely handle groups - ensure it's always an array
  const groups = Array.isArray(userInfo.groups) ? userInfo.groups : userInfo.groups ? [userInfo.groups] : []

  /**
   * @function getLevelBadge
   * @description Determines the appropriate badge text and color based on user level and buddy status.
   * @param {number} level - The user's level.
   * @param {number} [buddy] - Optional, 1 if the user is a buddy.
   * @returns {{text: string, color: string}} An object with badge text and color class.
   */
  const getLevelBadge = (level: number, buddy?: number) => {
    if (buddy === 1) return { text: "Buddy", color: "bg-blue-600" }
    if (level >= 3) return { text: "VIP", color: "bg-purple-600" }
    if (level >= 2) return { text: "Veteran", color: "bg-green-600" }
    return { text: "Member", color: "bg-gray-600" }
  }

  const levelBadge = getLevelBadge(userInfo.level, userInfo.buddy)

  // Render header variant of the component.
  if (variant === "header") {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8 flex-shrink-0"> {/* Smaller avatar */}
          <AvatarImage src={userInfo.avatar} alt={userInfo.username} referrerPolicy="no-referrer" />
          <AvatarFallback>
            {userInfo.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <h3 className="font-semibold text-gray-100 text-sm truncate">{userInfo.username}</h3>
          <div className="flex gap-1">
            <Badge variant="secondary" className="bg-gray-800 text-gray-300 text-xs flex-shrink-0">
              Level {userInfo.level}
            </Badge>
            <Badge className={`${levelBadge.color} text-white text-xs flex-shrink-0`}>{levelBadge.text}</Badge>
          </div>
        </div>
      </div>
    );
  }

  // Render default variant of the component.
  return (
    <Card className="w-full bg-gray-900 border-gray-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-100">
          <User className="h-5 w-5 flex-shrink-0" /> {/* Ensure icon doesn't shrink */}
          {!isCollapsed && "User Information"} {/* Hide text when collapsed */}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* User avatar and basic info, adjusts based on collapsed state */}
        <div className={`flex items-center ${isCollapsed ? 'flex-col space-x-0 space-y-2' : 'space-x-4'}`}> {/* Adjust layout for collapsed state */}
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={userInfo.avatar} alt={userInfo.username} referrerPolicy="no-referrer" />
            <AvatarFallback>
              {userInfo.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {/* User details (username, custom title, level badges), hidden when collapsed */}
          {!isCollapsed && ( // Hide this div when collapsed
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
          )}
          {/* Display only username when collapsed */}
          {isCollapsed && ( // Show only username when collapsed
            <h3 className="font-semibold text-gray-100 text-center text-sm truncate w-full">{userInfo.username}</h3>
          )}
        </div>

        {/* Detailed user information, hidden when collapsed */}
        {!isCollapsed && ( // Hide all detailed info when collapsed
          <>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="space-y-2">
                {/* Protection level */}
                <div className="flex items-center gap-2 text-gray-300">
                  <Shield className="h-4 w-4" />
                  <span>Protection: {getProtectionLevel(userInfo.protection, userInfo.protein_name)}</span>
                </div>
                {/* Score and XP */}
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
                {/* Registration date, posts, and Discord ID */}
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

            {/* Hotkeys section, conditionally rendered */}
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

            {/* Steam Accounts section, conditionally rendered */}
            {userInfo.steam && userInfo.steam.length > 0 && (
              <div className="pt-2 border-t border-gray-800">
                <p className="text-sm text-gray-300">Steam Accounts: {userInfo.steam.length}</p>
              </div>
            )}

            {/* Active Scripts section, conditionally rendered */}
            {userInfo.scripts && userInfo.scripts.length > 0 && (
              <div className="pt-2 border-t border-gray-800">
                <p className="text-sm text-gray-300">Active Scripts: {userInfo.scripts.length}</p>
              </div>
            )}

            {/* Loot Roll section */}
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
              {/* Display time until next roll if not available */}
              {!canRoll && (
                <p className="text-sm text-gray-400 mt-2">
                  Next roll in: {formatTime(timeUntilNextRoll)}
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
