'use client'

import { createContext, useContext, useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './_components/AppSidebar'
import WelcomeContainer from "./dashboard/_components/WelcomeContainer";
import { useUser as useAuthUser } from '@/app/provider'
import { Loader2 } from "lucide-react";

const DashboardContext = createContext(null)

export const useDashboard = () => useContext(DashboardContext)

export default function DashboardProvider({ children }) {
  const { user: authUser, loading: authLoading } = useAuthUser()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSidebar = () => setSidebarOpen(prev => !prev)

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-secondary">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardContext.Provider value={{ user: authUser, toggleSidebar, sidebarOpen }}>
      <SidebarProvider defaultOpen={sidebarOpen}>
        <AppSidebar />
        <div className="w-full min-h-screen bg-secondary">
          <div className="p-4">
            <SidebarTrigger onClick={toggleSidebar} />
          </div>
          <WelcomeContainer />
          <div className="px-6 pb-6">
            {children}
          </div>
        </div>
      </SidebarProvider>
    </DashboardContext.Provider>
  )
}
