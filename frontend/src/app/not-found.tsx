"use client"

import { AlertTriangle, Building2, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center space-y-6 text-center max-w-md mx-auto px-4">
        <div className="relative">
          <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-xl blur opacity-25"></div>
        </div>

        {/* 404 Icon and Text */}
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-4xl font-bold text-foreground">404</h1>
            <p className="text-lg font-medium text-muted-foreground">Page Not Found</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <p className="text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
          <p className="text-sm text-muted-foreground">Please check the URL or navigate back to a safe page.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button asChild className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex-1 border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Decorative Element */}
        <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full opacity-50"></div>
      </div>
    </div>
  )
}
