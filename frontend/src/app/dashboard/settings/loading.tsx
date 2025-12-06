import { Loader2, Building2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        {/* Company Logo/Icon */}
        <div className="relative">
          <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-xl blur opacity-25 animate-pulse"></div>
        </div>

        {/* Loading Spinner */}
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="text-lg font-medium text-foreground">Loading...</span>
        </div>

        {/* Loading Bar */}
        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full animate-pulse"></div>
        </div>

        {/* Loading Text */}
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Please wait while we prepare your workspace
        </p>
      </div>
    </div>
  )
}
