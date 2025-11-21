"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Truck, Plus, Package, DollarSign, User, IndianRupee } from "lucide-react"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/carrier/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Vehicles",
    href: "/carrier/vehicles",
    icon: Truck,
  },
  {
    title: "Create Trip",
    href: "/carrier/create-trip",
    icon: Plus,
  },
  {
    title: "My Trips",
    href: "/carrier/trips",
    icon: Package,
  },
  {
    title: "Booking Requests",
    href: "/carrier/bookings",
    icon: Package,
  },
  {
    title: "Earnings",
    href: "/carrier/earnings",
    icon: IndianRupee,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
]

export function CarrierSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-card border-r border-border h-full">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <Truck className="h-6 w-6 text-secondary" />
          <span className="text-lg font-semibold">Carrier Portal</span>
        </div>

        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
