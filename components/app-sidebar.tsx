"use client";

import * as React from "react";
import { ShoppingCart, LineChart, Settings2 } from "lucide-react";
import { useUser } from "@/contexts/user-context";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const navItems = [
  {
    title: "Orders",
    url: "/product/orders",
    icon: ShoppingCart,
  },
  {
    title: "PnL",
    url: "/product/pnl",
    icon: LineChart,
  },
  {
    title: "Settings",
    url: "/product/settings",
    icon: Settings2,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();

  if (!user) return null;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          teams={[{ name: user.role, logo: Settings2, plan: user.role }]}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
