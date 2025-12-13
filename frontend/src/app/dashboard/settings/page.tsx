import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  UserPlus,
  FileText,
  Shield,
  UsersIcon,
  Calendar,
  Palmtree,
  Smartphone,
  Fingerprint,
  MapPin,
  Building2,
  Users,
} from "lucide-react"

export default function SettingsPage() {
  const settingsSections = [
    {
      title: "Reports & Employees",
      description: "Manage employee reports and workforce",
      cards: [
        {
          title: "Report ",
          description: "Generate comprehensive employee reports",
          icon: FileText,
          href: "/dashboard/settings/report",
        },
       
        
        {
          title: "Add Employee",
          description: "Add new team members to your organization",
          icon: UserPlus,
          href: "/dashboard/settings/add_employees",
        },
      ],
    },
    {
      title: "Management",
      description: "Configure organizational structure and policies",
      cards: [
        {
          title: "Roles",
          description: "Define and manage user roles and permissions",
          icon: Shield,
          href: "/dashboard/settings/roles",
        },
        {
          title: "Groups",
          description: "Organize employees into groups and departments",
          icon: UsersIcon,
          href: "/dashboard/settings/groups",
        },
        {
          title: "Leave Category",
          description: "Configure leave types and policies",
          icon: Calendar,
          href: "/dashboard/settings/leave-categories",
        },
        {
          title: "Holiday",
          description: "Manage company holidays and observances",
          icon: Palmtree,
          href: "/dashboard/settings/holidays",
        },
      ],
    },
    {
      title: "Devices and Location",
      description: "Configure attendance tracking and location settings",
      cards: [
        {
          title: "Virtual Devices",
          description: "Manage virtual attendance devices",
          icon: Smartphone,
          href: "/dashboard/settings/virtual-device",
        },
        {
          title: "Biometric Devices",
          description: "Configure biometric attendance systems",
          icon: Fingerprint,
          href: "/dashboard/settings/biometric-device",
        },
        {
          title: "Update Location",
          description: "Manage office locations and geofencing",
          icon: MapPin,
          href: "/dashboard/settings/locations",
        },
      ],
    },
    // {
    //   title: "Company Settings",
    //   description: "Configure company-wide preferences and policies",
    //   cards: [
    //     {
    //       title: "Company Settings",
    //       description: "Manage company profile and general settings",
    //       icon: Building2,
    //       href: "/dashboard/company",
    //     },
    //   ],
    // },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your account and company settings.</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-8">
          {settingsSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-lg font-medium text-foreground border-l-4 border-blue-500 pl-3">{section.title}</h2>
                <p className="text-sm text-muted-foreground pl-3">{section.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {section.cards.map((card, cardIndex) => {
                  const IconComponent = card.icon
                  return (
                    <Link href={card.href} key={cardIndex}>
                      <Card
                        className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-500/50 border-l-4 border-l-yellow-500"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                              <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {card.title}
                              </CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                            {card.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>

              {sectionIndex < settingsSections.length - 1 && <Separator className="mt-6" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
