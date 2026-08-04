"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image src="/empsync-logo.png" alt="EmpSync AI" width={80} height={80} className="rounded-lg" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to EmpSync AI</CardTitle>
          <CardDescription>Your intelligent employee management platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => router.push("/auth/sign-in")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
