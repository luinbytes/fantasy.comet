import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

/**
 * @interface UserInfoSkeletonProps
 * @description Props for the UserInfoSkeleton component.
 * @property {boolean} isCollapsed - Indicates if the parent component (e.g., sidebar) is collapsed.
 * @property {"default" | "header"} [variant="default"] - The display variant of the skeleton.
 */
interface UserInfoSkeletonProps {
  isCollapsed: boolean;
  variant?: "default" | "header"; // New prop
}

/**
 * @component UserInfoSkeleton
 * @description A skeleton loader component for the UserInfoDisplay.
 * Displays a loading state with animated placeholders for user information.
 * @param {UserInfoSkeletonProps} props - The props for the UserInfoSkeleton component.
 * @returns {JSX.Element} The rendered UserInfoSkeleton component.
 */
export function UserInfoSkeleton({ isCollapsed, variant = "default" }: UserInfoSkeletonProps) {
  // Render header variant of the skeleton.
  if (variant === "header") {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full bg-gray-800 animate-blink" /> {/* Smaller avatar skeleton */}
        <div className="flex flex-col">
          <Skeleton className="h-4 w-24 bg-gray-800 animate-blink" /> {/* Username skeleton */}
          <div className="flex gap-1">
            <Skeleton className="h-3 w-16 bg-gray-800 animate-blink" /> {/* Level badge skeleton */}
            <Skeleton className="h-3 w-12 bg-gray-800 animate-blink" /> {/* Other badge skeleton */}
          </div>
        </div>
      </div>
    );
  }

  // Render default variant of the skeleton.
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        {/* Skeleton for the card title, hidden when collapsed */}
        {!isCollapsed && <Skeleton className="h-6 w-32 bg-gray-800 animate-blink" />}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Skeleton for avatar and basic info, adjusts based on collapsed state */}
        <div className={`flex items-center ${isCollapsed ? 'flex-col space-x-0 space-y-2' : 'space-x-4'}`}>
          <Skeleton className="h-12 w-12 rounded-full bg-gray-800 animate-blink" />
          {/* Skeleton for username and badges, hidden when collapsed */}
          {!isCollapsed && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 bg-gray-800 animate-blink" />
              <Skeleton className="h-3 w-16 bg-gray-800 animate-blink" />
            </div>
          )}
          {/* Placeholder for username when collapsed */}
          {isCollapsed && (
            <Skeleton className="h-4 w-16 bg-gray-800 animate-blink" /> // Placeholder for username when collapsed
          )}
        </div>
        {/* Skeletons for detailed information, hidden when collapsed */}
        {!isCollapsed && (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full bg-gray-800 animate-blink" />
            <Skeleton className="h-3 w-3/4 bg-gray-800 animate-blink" />
            <Skeleton className="h-3 w-1/2 bg-gray-800 animate-blink" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
