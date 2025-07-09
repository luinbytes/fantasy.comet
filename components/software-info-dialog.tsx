


import { useState, useEffect, useCallback } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Package, Code, Clock, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

/**
 * @interface SoftwareDetails
 * @description Defines the structure for detailed software information displayed in the dialog.
 * @property {string} version - The version of the software.
 * @property {string} name - The name of the software.
 * @property {number} last_update - Timestamp of the last update.
 * @property {string} elapsed - Human-readable string indicating time since last update.
 * @property {Script[]} [scripts] - Optional array of associated scripts.
 * @property {Object} [checksum] - Optional checksum information for Windows and Linux versions.
 * @property {string} checksum.windows - Checksum for the Windows version.
 * @property {string} checksum.linux - Checksum for the Linux version.
 */
interface SoftwareDetails {
  version: string
  name: string
  last_update: number
  elapsed: string
  scripts?: Script[]
  checksum?: {
    windows: string
    linux: string
  }
}

/**
 * @interface SoftwareInfoDialogProps
 * @description Props for the SoftwareInfoDialog component.
 * @property {boolean} isOpen - Controls the visibility of the dialog.
 * @property {() => void} onClose - Callback function to close the dialog.
 * @property {SoftwareDetails | null} softwareDetails - The software details to display in the dialog.
 */
interface SoftwareInfoDialogProps {
  isOpen: boolean
  onClose: () => void
  softwareDetails: SoftwareDetails | null
}

/**
 * @interface Script
 * @description Defines the structure for a script associated with a software.
 * @property {string | number} id - The unique identifier of the script.
 * @property {string} name - The name of the script.
 * @property {string} author - The author of the script.
 * @property {string} elapsed - Human-readable string indicating time since last update.
 */
interface Script {
  id: string | number
  name: string
  author: string
  elapsed: string
}

/**
 * @component SoftwareInfoDialog
 * @description A dialog component to display detailed information about a selected software package.
 * Includes version, update status, checksums, and associated scripts.
 * @param {SoftwareInfoDialogProps} props - The props for the SoftwareInfoDialog component.
 * @returns {JSX.Element} The rendered SoftwareInfoDialog component.
 */
export function SoftwareInfoDialog({ isOpen, onClose, softwareDetails }: SoftwareInfoDialogProps) {
  /**
   * @function getUpdateStatus
   * @description Determines the update status of a software based on its elapsed time.
   * @param {string} elapsed - The human-readable elapsed time since the last update.
   * @returns {{color: string, text: string}} An object with color class and status text.
   */
  const getUpdateStatus = (elapsed: string) => {
    if (elapsed.includes("hour") || elapsed.includes("day")) return { color: "bg-green-600", text: "Recent" }
    if (elapsed.includes("week") || elapsed.includes("month")) return { color: "bg-yellow-600", text: "Moderate" }
    return { color: "bg-red-600", text: "Old" }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          {/* Dialog title displaying software name */}
          <AlertDialogTitle className="flex items-center gap-2 text-gray-100">
            <Package className="h-6 w-6" />
            {softwareDetails?.name} Details
          </AlertDialogTitle>
          {/* Dialog description */}
          <AlertDialogDescription>
            View detailed information about {softwareDetails?.name}, including version, update status, checksums, and associated scripts.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* Conditional rendering based on whether software details are available */}
        {softwareDetails ? (
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-gray-300">
              {/* Software version and update details */}
              <div className="grid grid-cols-2 gap-2">
                <div><strong>Version:</strong> {softwareDetails.version}</div>
                <div className="flex items-center gap-1">
                  <strong>Last Update:</strong> {softwareDetails.elapsed}
                  <Badge className={`${getUpdateStatus(softwareDetails.elapsed).color} text-white text-xs`}>
                    {getUpdateStatus(softwareDetails.elapsed).text}
                  </Badge>
                </div>
                <div><strong>Updated On:</strong> {new Date(softwareDetails.last_update * 1000).toLocaleDateString()}</div>
              </div>

              {/* Checksums section, conditionally rendered */}
              {softwareDetails.checksum && (
                <div className="space-y-2 border-t border-gray-700 pt-4 mt-4">
                  <h4 className="font-semibold text-gray-100">Checksums</h4>
                  {softwareDetails.checksum.windows && <div><strong>Windows:</strong> <code className="break-all bg-gray-800 p-1 rounded text-xs">{softwareDetails.checksum.windows}</code></div>}
                  {softwareDetails.checksum.linux && <div><strong>Linux:</strong> <code className="break-all bg-gray-800 p-1 rounded text-xs">{softwareDetails.checksum.linux}</code></div>}
                </div>
              )}

              {/* Associated Scripts section, conditionally rendered */}
              {softwareDetails.scripts && softwareDetails.scripts.length > 0 && (
                <div className="space-y-2 border-t border-gray-700 pt-4 mt-4">
                  <h4 className="font-semibold text-gray-100 flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Associated Scripts ({softwareDetails.scripts.length})
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                        {softwareDetails.scripts.map((script) => (
                          <li key={script.id} className="text-sm">
                            <strong>{script.name}</strong> by {script.author} (Updated: {script.elapsed})
                          </li>
                        ))}
                      </ul>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <>
            {/* Loading indicator if software details are not yet available */}
            <div className="flex items-center justify-center space-x-2 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              <span className="text-gray-400">Loading software details...</span>
            </div>
          </>
        )}
        {/* Close button for the dialog */}
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

