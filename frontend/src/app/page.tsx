"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md rounded-[28px] border-slate-200 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.12)]">
        <CardHeader className="text-center space-y-4 px-8 pt-10">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 shadow-sm">
            <Image src="/empsync-logo.png" alt="EmpSync AI" width={80} height={80} />
          </div>
          <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900">Welcome to EmpSync AI</CardTitle>
          <CardDescription className="mx-auto max-w-sm text-sm text-slate-500">
            Your intelligent employee management platform
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <Button
            onClick={() => router.push("/auth/sign-in")}
            className="w-full rounded-full bg-teal-700 px-6 py-3 text-white shadow-lg shadow-teal-200/50 hover:bg-teal-800"
          >
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
