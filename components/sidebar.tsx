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
  Terminal,
  LucideProps,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import React, { useState } from "react"
import { ClientLucideIcon } from "./client-lucide-icon"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"

/**
 * @interface SidebarProps
 * @description Props for the Sidebar component.
 * @property {string} activeCategory - The currently active category ID.
 * @property {(category: string) => void} onCategoryChange - Callback function to handle category change.
 * @property {boolean} isCollapsed - Indicates if the sidebar is in a collapsed state.
 */
interface SidebarProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
  isCollapsed: boolean
}

// Type alias for Lucide icons to ensure type safety.
type LucideIcon = React.ComponentType<LucideProps>;

// Defines the structure and content of sidebar categories and their items.
const categories = [
  {
    id: "core",
    label: "Core Features",
    items: [
      { id: "scripts", label: "Scripts", icon: Code },
      { id: "software", label: "Software", icon: Gamepad2 },
      { id: "config", label: "Config", icon: Settings },
    ],
  },
  {
    id: "account",
    label: "Account Management",
    items: [
      { id: "member", label: "Member", icon: Users },
      { id: "perks", label: "Perks & XP", icon: Star },
      { id: "ai", label: "AI Features", icon: Bot },
    ],
  },
  {
    id: "project",
    label: "Project Tools",
    items: [
      { id: "fc2t", label: "FC2T", icon: Folder },
      { id: "builds", label: "Builds", icon: Upload },
      { id: "minecraft", label: "Minecraft", icon: Server },
    ],
  },
  {
    id: "utilities",
    label: "Utilities",
    items: [
      { id: "forum", label: "Forum", icon: FileText },
      { id: "settings", label: "Settings", icon: Settings },
      { id: "test", label: "API Test", icon: Terminal },
    ],
  },
];

/**
 * @component Sidebar
 * @description A collapsible sidebar navigation component for the application.
 * Displays categories and their respective items, allowing navigation between different sections.
 * @param {SidebarProps} props - The props for the Sidebar component.
 * @returns {JSX.Element} The rendered Sidebar component.
 */
export function Sidebar({ activeCategory, onCategoryChange, isCollapsed }: SidebarProps) {
  // State to manage which category groups are open/collapsed.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    // Initialize all groups as open by default
    const initialOpen = new Set<string>();
    categories.forEach(group => initialOpen.add(group.id));
    return initialOpen;
  });

  /**
   * @function toggleGroup
   * @description Toggles the open/closed state of a category group in the sidebar.
   * @param {string} groupId - The ID of the group to toggle.
   */
  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  return (
    <nav className="space-y-4">
      {/* Map through each category group to render collapsible sections */}
      {categories.map((group, groupIndex) => (
        <React.Fragment key={group.id}>
          <Collapsible
            open={openGroups.has(group.id) && !isCollapsed} // Only open if not collapsed
            onOpenChange={() => toggleGroup(group.id)}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              {/* Button to trigger collapsible group */}
              <Button
                variant="ghost"
                className={`w-full ${isCollapsed ? 'justify-center' : 'justify-between'} text-gray-300 hover:text-white hover:bg-gray-800 px-4 py-2 h-9`} // Center content when collapsed
              >
                {/* Group label, hidden when collapsed */}
                {!isCollapsed && ( // Hide group label when collapsed
                  <span className="font-semibold text-sm uppercase tracking-wider overflow-hidden text-ellipsis whitespace-nowrap">
                    {group.label}
                  </span>
                )}
                {/* Chevron icon to indicate collapsible state, hidden when collapsed */}
                {!isCollapsed && ( // Hide chevron when collapsed
                  openGroups.has(group.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {/* Map through items within each group to render navigation buttons */}
              {group.items.map((category) => {
                const Icon = category.icon
                const isActive = activeCategory === category.id

                return (
                  <Button
                    key={category.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onCategoryChange(category.id)}
                    className={`w-full justify-start flex items-center gap-2 px-4 py-2 h-9 ${
                      isActive
                        ? `bg-accent text-accent-foreground hover:opacity-90`
                        : "text-gray-300 hover:text-white hover:bg-gray-800"
                    } ${isCollapsed ? 'justify-center' : ''}`} // Center and remove horizontal padding when collapsed
                  >
                    {/* Icon for the category item */}
                    <ClientLucideIcon icon={Icon} className="h-4 w-4 flex-shrink-0" />
                    {/* Category label, hidden when collapsed */}
                    {!isCollapsed && category.label} {/* Hide label when collapsed */}
                  </Button>
                )
              })}
            </CollapsibleContent>
          </Collapsible>
          {/* Separator between category groups, hidden when collapsed */}
          {groupIndex < categories.length - 1 && !isCollapsed && <Separator className="my-2 bg-gray-700" />} {/* Hide separator when collapsed */}
        </React.Fragment>
      ))}
    </nav>
  )
}
