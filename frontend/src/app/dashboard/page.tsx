/*export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Welcome to EmpSync AI</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-card rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">Total Employees</h3>
          <p className="text-3xl font-bold text-blue-600">247</p>
        </div>

        <div className="p-6 bg-card rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">Active Projects</h3>
          <p className="text-3xl font-bold text-yellow-600">12</p>
        </div>

        <div className="p-6 bg-card rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">Sync Status</h3>
          <p className="text-3xl font-bold text-green-600">98%</p>
        </div>
      </div>
    </div>
  )
}
*/
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard/employees")
  }, [router])

  return null
}

