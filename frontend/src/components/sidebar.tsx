"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Users, Settings, Building2, Calendar } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    {
      title: "Employees",
      icon: Users,
      href: "/dashboard/employees",
    },
    // {
    //   title: "Calendar",
    //   icon: Calendar,
    //   href: "/dashboard/calendar",
    // },
    { icon: Settings, title: "Settings", href: "/dashboard/settings" },
    { icon: Building2, title: "Company Profile", href: "/dashboard/company" },
  ]

  return (
    <div
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {/* Logo and title when expanded */}
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <Image src="/empsync-logo.png" alt="EmpSync AI" width={32} height={32} className="rounded-md" />
              <span className="font-semibold text-sidebar-foreground">EmpSync AI</span>
            </div>
          )}

          {/* Logo when collapsed */}
          {collapsed && (
            <div className="flex justify-center w-full">
              <Image src="/empsync-logo.png" alt="EmpSync AI" width={24} height={24} className="rounded-md" />
            </div>
          )}

          {/* Toggle Buttons */}
          {!collapsed ? (
            // Collapse Button
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(true)}
              className="h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            // Expand Button (shown in same spot)
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(false)}
              className="h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors",
                  collapsed && "justify-center",
                )}
              >
                <item.icon className="h-5 w-5 text-blue-600" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
