import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function UserInfoSkeleton() {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <Skeleton className="h-6 w-32 bg-gray-800 animate-blink" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full bg-gray-800 animate-blink" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-gray-800 animate-blink" />
            <Skeleton className="h-3 w-16 bg-gray-800 animate-blink" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full bg-gray-800 animate-blink" />
          <Skeleton className="h-3 w-3/4 bg-gray-800 animate-blink" />
          <Skeleton className="h-3 w-1/2 bg-gray-800 animate-blink" />
        </div>
      </CardContent>
    </Card>
  )
}
