"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Settings,
  Building2,
  CalendarX,
  Fingerprint,
  ChevronDown,
  UserPlus,
  FileText,
  Shield,
  UsersIcon,
  Tags,
  Briefcase,
  Globe,
  Smartphone,
  MapPin,
  Navigation
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { usePathname } from "next/navigation"

interface SidebarProps {
  className?: string
}

type MenuItem = {
  title: string
  icon: any
  href?: string
  children?: MenuItem[]
  adminOnly?: boolean
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})
  const [activeFloatingMenu, setActiveFloatingMenu] = useState<MenuItem | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { isAdmin } = useAuth()
  const pathname = usePathname()

  // Click outside to close floating menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeFloatingMenu && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setActiveFloatingMenu(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [activeFloatingMenu])

  const toggleMenu = (title: string, parentItems?: string[]) => {
    setOpenMenus(prev => {
      const isOpening = !prev[title]
      if (!isOpening) return { ...prev, [title]: false }
      
      const newState: Record<string, boolean> = { ...prev }
      if (parentItems) {
        parentItems.forEach(item => { newState[item] = false })
      }
      newState[title] = true
      return newState
    })
  }

  const menuItems: MenuItem[] = [
    { title: "Punch Records", icon: Fingerprint, href: "/dashboard/mypunches" },
    {
      title: isAdmin ? "Leaves & Holiday" : "Leaves",
      icon: CalendarX,
      href: "/dashboard/leaves"
    },
    ...(isAdmin ? [{ title: "Employees", icon: Users, href: "/dashboard/employees" }] : []),
    { title: "Company", icon: Building2, href: "/dashboard/company" },
    {
      title: "Settings", icon: Settings, href: "/dashboard/settings", adminOnly: true,
      children: [
        {
          title: "Workforce", icon: Users,
          children: [
            { title: "Add Employee", icon: UserPlus, href: "/dashboard/settings/add_employees" },
            { title: "Employee Report", icon: FileText, href: "/dashboard/settings/report" },
          ]
        },
        {
          title: "Management", icon: Shield,
          children: [
            { title: "Roles", icon: Shield, href: "/dashboard/settings/roles" },
            { title: "Groups", icon: UsersIcon, href: "/dashboard/settings/groups" },
            { title: "Staff Category", icon: Tags, href: "/dashboard/settings/staff-categories" },
            { title: "Staff Types", icon: Briefcase, href: "/dashboard/settings/staff-types" },
            { title: "Religion & Caste", icon: Globe, href: "/dashboard/settings/religion-caste" },
          ]
        },
        {
          title: "Device Location", icon: MapPin,
          children: [
            { title: "Virtual Device", icon: Smartphone, href: "/dashboard/settings/virtual-device" },
            { title: "Biometric Device", icon: Fingerprint, href: "/dashboard/settings/biometric-device" },
            { title: "Update Location", icon: Navigation, href: "/dashboard/settings/locations" },
          ]
        }
      ]
    },
  ]

  const isChildActive = (item: MenuItem): boolean => {
    if (item.href === pathname) return true
    if (item.children) {
      return item.children.some(child => isChildActive(child))
    }
    return false
  }

  const renderMenuItem = (item: MenuItem, depth = 0, siblings?: string[], forceShowLabel = false) => {
    if (item.adminOnly && !isAdmin) return null

    const hasChildren = item.children && item.children.length > 0
    const isOpen = openMenus[item.title]
    const isActive = item.href ? pathname === item.href : false
    const childIsActive = hasChildren ? isChildActive(item) : false
    const showLabel = !collapsed || forceShowLabel

    return (
      <li key={item.title} className="relative">
        {hasChildren ? (
          <div>
            <button
              onClick={() => {
                if (collapsed && !forceShowLabel) {
                  setActiveFloatingMenu(activeFloatingMenu?.title === item.title ? null : item)
                } else {
                  toggleMenu(item.title, siblings)
                }
              }}
              className={cn(
                "w-full group flex items-center justify-between px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-gray-100 transition-all duration-200",
                (collapsed && !forceShowLabel) && "justify-center",
                (isActive || (childIsActive && !isOpen)) && "text-blue-600 bg-blue-50/80"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-colors duration-200",
                  (isActive || childIsActive) ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-500 group-hover:bg-gray-100 group-hover:text-blue-600"
                )}>
                  <item.icon className={cn(
                    depth === 0 ? "h-4 w-4" : 
                    depth === 1 ? "h-3.5 w-3.5" : "h-3 w-3"
                  )} />
                </div>
                {showLabel && (
                  <span className={cn(
                    "font-semibold transition-colors duration-200",
                    depth === 0 ? "text-sm" : "text-[13px]",
                    (isActive || childIsActive) ? "text-blue-800" : "text-gray-700"
                  )}>
                    {item.title}
                  </span>
                )}
              </div>
              {showLabel && (
                <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
              )}
            </button>
            {isOpen && showLabel && (
              <ul className={cn(
                "mt-1 space-y-1 ml-4 border-l border-blue-300 pl-2",
                depth === 0 ? "ml-4" : "ml-3"
              )}>
                {item.children?.map(child => renderMenuItem(child, depth + 1, item.children?.map(c => c.title), forceShowLabel))}
              </ul>
            )}
          </div>
        ) : (
          <div className="relative group">
            {(isActive && !collapsed) && (
              <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 h-5 w-1 bg-blue-600 rounded-r-full" />
            )}
            <Link
              href={item.href || "#"}
              onClick={() => collapsed && setActiveFloatingMenu(null)}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sidebar-foreground transition-all duration-200",
                (collapsed && !forceShowLabel) && "justify-center",
                isActive ? "bg-blue-50 text-blue-800 font-bold shadow-sm border border-blue-100" : "hover:bg-gray-100"
              )}
              title={(collapsed && !forceShowLabel) ? item.title : ""}
            >
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200",
                isActive ? "bg-blue-600 text-white shadow-blue-200 shadow-md" : "text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600"
              )}>
                <item.icon className={cn(
                  depth === 0 ? "h-4 w-4" : 
                  depth === 1 ? "h-3.5 w-3.5" : "h-3 w-3"
                )} />
              </div>
              {showLabel && (
                <span className={cn(
                  "transition-colors duration-200",
                  depth === 0 ? "text-sm font-semibold" : 
                  depth === 1 ? "text-[13px] font-semibold" : "text-[13px] font-medium",
                  isActive ? "text-blue-800" : "text-gray-700"
                )}>
                  {item.title}
                </span>
              )}
            </Link>
          </div>
        )}
      </li>
    )
  }

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "relative flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 shadow-md z-20",
        collapsed ? "w-20" : "w-68",
        className,
      )}
    >
      {/* Header */}
      <div className="h-[65px] px-4 mb-2 flex items-center border-b border-sidebar-border bg-white">
        <div className="flex items-center justify-between w-full relative">
          {!collapsed && (

            <div className="flex items-center h-11 space-x-3 bg-blue-50 p-2 rounded-xl border border-blue-100 animate-in fade-in duration-300">
              <div className="p-1 bg-white rounded-lg shadow-sm">
                <Image src="/empsync-logo.png" alt="EmpSync AI" width={24} height={24} className="rounded-md" />
              </div>
              <span className="text-gray-900 font-bold tracking-tight">EmpSync AI</span>
            </div>
          )}

          {collapsed && (
            <div className="flex justify-center w-full animate-in fade-in duration-300">
              <div className="flex items-center justify-center h-11 w-11 bg-blue-50 rounded-xl border border-blue-100">
                <div className="p-1 bg-white rounded-lg shadow-sm">
                  <Image src="/empsync-logo.png" alt="EmpSync AI" width={24} height={24} className="rounded-md" />
                </div>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCollapsed(!collapsed)
              setActiveFloatingMenu(null)
            }}
            className={`h-10 w-6 p-0 text-gray-400 hover:text-blue-600 absolute -right-10 top-[1px] bg-white border border-l-0 border-gray-200 shadow-[4px_0_10px_rgba(0,0,0,0.08)] rounded-r-xl rounded-l-none z-10 focus-visible:ring-0`}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>


      {/* Navigation */}
      <nav className="flex-1 p-3 mb-2 overflow-y-auto custom-scrollbar">
        <ul className="space-y-2">
          {menuItems.map((item) => renderMenuItem(item))}
        </ul>
      </nav>

      {/* Floating Menu for Collapsed Sidebar */}
      {collapsed && activeFloatingMenu && (
        <div className="absolute left-[82px] top-1/4 min-w-[240px] bg-white border border-gray-200 shadow-2xl rounded-xl p-3 z-[100] animate-in fade-in slide-in-from-left-2 duration-200">
          <div className="px-3 py-2 border-b border-gray-100 mb-3 bg-gray-50/50 rounded-t-lg">
             <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-[0.2em]">{activeFloatingMenu.title}</span>
          </div>
          <ul className="space-y-1.5">
            {activeFloatingMenu.children?.map(child => renderMenuItem(
              child, 
              1, 
              activeFloatingMenu.children?.map(c => c.title), 
              true
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}