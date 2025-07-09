"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Settings, Palette } from "lucide-react"
import { useTheme } from "@/components/theme-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

/**
 * @interface SettingsDashboardProps
 * @description Props for the SettingsDashboard component.
 * @property {(isEnabled: boolean) => void} onBuddyToggle - Callback function to handle buddy mode toggle.
 */
interface SettingsDashboardProps {
  onBuddyToggle: (isEnabled: boolean) => void;
  handleApiRequest: (params: Record<string, any>, method?: "GET" | "POST", postData?: Record<string, any>) => Promise<any | null>;
}

/**
 * @component SettingsDashboard
 * @description A dashboard component for configuring application settings, including buddy mode and theme settings.
 * @param {SettingsDashboardProps} props - The props for the SettingsDashboard component.
 * @returns {JSX.Element} The rendered SettingsDashboard component.
 */
export function SettingsDashboard({ onBuddyToggle }: SettingsDashboardProps) {
  // State to manage the buddy mode toggle status.
  const [isBuddyModeEnabled, setIsBuddyModeEnabled] = useState(false)
  // Destructure theme and setTheme from the useTheme hook for theme management.
  const { theme, setTheme } = useTheme()
  // State for custom primary color input.
  const [customPrimary, setCustomPrimary] = useState("")
  // State for custom primary foreground color input.
  const [customPrimaryForeground, setCustomPrimaryForeground] = useState("")
  // State for custom ring color input.
  const [customRing, setCustomRing] = useState("")

  /**
   * @function useEffect
   * @description Effect hook to load saved settings from local storage when the component mounts.
   * This includes buddy mode status and custom theme values.
   */
  useEffect(() => {
    const savedBuddyMode = localStorage.getItem("buddy-mode")
    if (savedBuddyMode) {
      setIsBuddyModeEnabled(JSON.parse(savedBuddyMode))
    }

    // Load custom theme values if they exist
    const savedCustomPrimary = localStorage.getItem("custom-primary")
    const savedCustomPrimaryForeground = localStorage.getItem("custom-primary-foreground")
    const savedCustomRing = localStorage.getItem("custom-ring")

    if (savedCustomPrimary) setCustomPrimary(savedCustomPrimary)
    if (savedCustomPrimaryForeground) setCustomPrimaryForeground(savedCustomPrimaryForeground)
    if (savedCustomRing) setCustomRing(savedCustomRing)

  }, [])

  /**
   * @function handleBuddyModeToggle
   * @description Handles the change event of the buddy mode switch.
   * Updates the state, saves to local storage, and calls the onBuddyToggle callback.
   * @param {boolean} checked - The new checked state of the switch.
   */
  const handleBuddyModeToggle = (checked: boolean) => {
    setIsBuddyModeEnabled(checked)
    localStorage.setItem("buddy-mode", JSON.stringify(checked))
    onBuddyToggle(checked)
  }

  /**
   * @function handleApplyCustomTheme
   * @description Applies the custom theme based on the input color values.
   * Saves the custom colors to local storage and sets CSS variables.
   */
  const handleApplyCustomTheme = () => {
    // Save custom theme values to localStorage
    localStorage.setItem("custom-primary", customPrimary)
    localStorage.setItem("custom-primary-foreground", customPrimaryForeground)
    localStorage.setItem("custom-ring", customRing)

    // Apply custom theme by setting CSS variables directly
    document.documentElement.style.setProperty('--primary', customPrimary);
    document.documentElement.style.setProperty('--primary-foreground', customPrimaryForeground);
    document.documentElement.style.setProperty('--ring', customRing);

    setTheme("custom") // Set theme to 'custom' to indicate custom values are active
  }

  return (
    <div className="space-y-6">
      {/* Page header with title and description */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Settings</h2>
          <p className="text-gray-400">Configure application settings</p>
        </div>
      </div>

      {/* Buddy Features Card */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <Settings className="h-5 w-5" />
            Buddy Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle switch for Buddy Mode */}
          <div className="flex items-center justify-between">
            <Label htmlFor="buddy-mode" className="text-gray-300">Enable Buddy Mode</Label>
            <Switch
              id="buddy-mode"
              checked={isBuddyModeEnabled}
              onCheckedChange={handleBuddyModeToggle}
              className=""
            />
          </div>
          {/* Description for Buddy Mode */}
          <p className="text-sm text-gray-400">
            Enabling this will show additional features for buddy users, such as the Buddy System card in the Member category.
          </p>
        </CardContent>
      </Card>

      {/* Theme Settings Card */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <Palette className="h-5 w-5" />
            Theme Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theme selection dropdown */}
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-select" className="text-gray-300">Application Theme</Label>
            <Select onValueChange={(value) => setTheme(value as any)} value={theme}>
              <SelectTrigger id="theme-select" className="w-[180px]">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="emerald">Emerald</SelectItem>
                <SelectItem value="ruby">Ruby</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Description for theme selection */}
          <p className="text-sm text-gray-400">
            Choose a preset theme for the application.
          </p>

          {/* Custom Theme section */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h4 className="text-lg font-semibold text-gray-100">Custom Theme</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input for Primary Color */}
              <div>
                <Label htmlFor="custom-primary" className="text-gray-300">Primary Color (HSL)</Label>
                <Input
                  id="custom-primary"
                  value={customPrimary}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  placeholder="e.g., 263.4 70% 50.4%"
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
              </div>
              {/* Input for Primary Foreground Color */}
              <div>
                <Label htmlFor="custom-primary-foreground" className="text-gray-300">Primary Foreground (HSL)</Label>
                <Input
                  id="custom-primary-foreground"
                  value={customPrimaryForeground}
                  onChange={(e) => setCustomPrimaryForeground(e.target.value)}
                  placeholder="e.g., 210 20% 98%"
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
              </div>
              {/* Input for Ring Color */}
              <div>
                <Label htmlFor="custom-ring" className="text-gray-300">Ring Color (HSL)</Label>
                <Input
                  id="custom-ring"
                  value={customRing}
                  onChange={(e) => setCustomRing(e.target.value)}
                  placeholder="e.g., 263.4 70% 50.4%"
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
              </div>
            </div>
            {/* Button to apply custom theme */}
            <Button onClick={handleApplyCustomTheme} className="w-full">
              Apply Custom Theme
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
