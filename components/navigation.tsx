"use client"
import { Button } from "@/components/ui/button"
import {
  Code,
  Users,
  Settings,
  Gamepad2,
  FileText,
  Star,
  Bot,
  Folder,
  Upload,
  Server,
  Languages,
  Terminal,
  LucideProps,
} from "lucide-react"
import React from "react"
import { categorySettings } from "@/lib/category-settings"
import { ClientLucideIcon } from "./client-lucide-icon"

interface NavigationProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
}

type LucideIcon = React.ComponentType<LucideProps>;

const categories: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "scripts", label: "Scripts", icon: Code },
  { id: "member", label: "Member", icon: Users },
  { id: "software", label: "Software", icon: Gamepad2 },
  { id: "config", label: "Config", icon: Settings },
  { id: "forum", label: "Forum", icon: FileText },
  { id: "perks", label: "Perks & XP", icon: Star },
  { id: "ai", label: "AI Features", icon: Bot },
  { id: "fc2t", label: "FC2T", icon: Folder },
  { id: "builds", label: "Builds", icon: Upload },
  { id: "minecraft", label: "Minecraft", icon: Server },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "test", label: "API Test", icon: Terminal },
]

export function Navigation({ activeCategory, onCategoryChange }: NavigationProps) {
  return (
    <nav className="flex flex-wrap gap-3">
      {categories.map((category) => {
        const Icon = category.icon

        const isActive = activeCategory === category.id

        return (
          <Button
            key={category.id}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => onCategoryChange(category.id)}
            className={`flex items-center gap-2 px-4 py-2 h-9 ${
              isActive
                ? `${categorySettings[category.id]?.color || "bg-gray-600"} text-white hover:opacity-90`
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            }`}
          >
            <ClientLucideIcon icon={Icon} className="h-4 w-4" />
            {category.label}
          </Button>
        )
      })}
    </nav>
  )
}