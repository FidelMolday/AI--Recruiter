"use client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SideBarOptions as SidebarOptions } from "@/services/Constants";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  
  const path=usePathname();
    
  return (
    <Sidebar>
      {/* Header with logo and create button */}
      <SidebarHeader className="flex flex-col items-center mt-5 space-y-3">
        <div className="flex flex-col items-center gap-2">
          <img
            src="/logo.svg"
            alt="AI Recruiter Logo"
            width={60}
            height={60}
            className="w-[60px] h-[60px]"
          />
          <span className="text-xl font-bold text-primary">AI Recruiter</span>
        </div>
        <Link href="/dashboard/create-interview" className="w-full">
          <Button className="w-full flex items-center justify-center">
            <Plus className="mr-2" /> Create New Interview
          </Button>
        </Link>
      </SidebarHeader>

      {/* Sidebar menu content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {SidebarOptions.map((option, index) => (
              <SidebarMenuItem key={index} className="p-1">
                <SidebarMenuButton asChild className={"p-5"}>
                  <Link href={option.path}>
                    <option.Icon /> 
                    <span className={`text-[16px] ${path === option.path ? 'text-primary font-medium' : ''}`}>
                      {option.name}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter />
    </Sidebar>
  );
}
