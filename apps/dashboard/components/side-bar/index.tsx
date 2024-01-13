"use client"
import React from "react"
import Box from "@mui/joy/Box"
import List from "@mui/joy/List"
import Sheet from "@mui/joy/Sheet"
import Divider from "@mui/material/Divider"
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong"
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined"
import LinkIcon from "@mui/icons-material/Link"
import { usePathname } from "next/navigation"
import SecurityIcon from "@mui/icons-material/Security"
import KeyIcon from "@mui/icons-material/Key"
import PaymentsIcon from "@mui/icons-material/Payments"

import Logo from "./../logo"
import { SidebarStyles } from "./side-bar-style"
import { SidebarOverlay } from "./side-bar-overlay"
import { NavigationLink } from "./navigation-links"

const Sidebar: React.FC = () => {
  const path = usePathname()
  const isCurrentPath = (href: string): boolean => path === href

  return (
    <Sheet
      className="Sidebar"
      sx={{
        position: {
          xs: "fixed",
          md: "sticky",
        },
        transform: {
          xs: "translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1)))",
          md: "none",
        },
        transition: "transform 0.4s, width 0.4s",
        zIndex: 10000,
        height: "100dvh",
        width: "var(--Sidebar-width)",
        top: 0,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        borderRight: "1px solid",
        borderColor: "divider",
      }}
    >
      <SidebarStyles />
      <SidebarOverlay />
      <Box
        sx={{
          minHeight: 0,
          overflow: "hidden auto",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            alignItems: "flex-start",
            display: "flex",
            padding: "1.2em 1em 0 1em",
          }}
        >
          <Logo />
        </Box>
        <Divider
          sx={{
            width: "85%",
            alignItems: "center",
            margin: "0 auto",
          }}
        />
        <List
          sx={{
            "& .MuiListItem-root": {
              mb: 1,
            },
          }}
        >
          <NavigationLink
            href="/"
            icon={<HomeOutlinedIcon />}
            label="Home"
            isCurrentPath={isCurrentPath}
            dataTestid="sidebar-home-link"
          />
          <NavigationLink
            href="/transactions"
            icon={<ReceiptLongIcon />}
            label="Transactions"
            isCurrentPath={isCurrentPath}
            dataTestid="sidebar-transactions-link"
          />
          <NavigationLink
            href="/security"
            icon={<SecurityIcon />}
            label="Security"
            isCurrentPath={isCurrentPath}
            dataTestid="sidebar-security-link"
          />
          <NavigationLink
            href="/api-keys"
            icon={<KeyIcon />}
            label="API Keys"
            isCurrentPath={isCurrentPath}
            dataTestid="sidebar-api-keys-link"
          />
          <NavigationLink
            href="/callback"
            icon={<LinkIcon />}
            label="Callback Endpoints"
            isCurrentPath={isCurrentPath}
            dataTestid="sidebar-callback-link"
          />
          <NavigationLink
            href="/batch-payments"
            icon={<PaymentsIcon />}
            label="Batch Payments"
            isCurrentPath={isCurrentPath}
            dataTestid="sidebar-batch-payments-link"
            badge="Alpha"
          />
        </List>
      </Box>
    </Sheet>
  )
}

export default Sidebar
