import React from "react"
import Link from "next/link"
import ListItem from "@mui/joy/ListItem"
import ListItemButton from "@mui/joy/ListItemButton"
import { Badge, Typography } from "@mui/joy"

import { closeSidebar } from "./../utils"

interface NavigationLinkProps {
  href: string
  icon: React.ReactElement
  label: string
  isCurrentPath: (href: string) => boolean
  dataTestid: string
  badge?: string
}

export const NavigationLink: React.FC<NavigationLinkProps> = ({
  href,
  icon,
  label,
  isCurrentPath,
  dataTestid,
  badge,
}) => (
  <Link data-testid={dataTestid} href={href}>
    <ListItem>
      <ListItemButton
        onClick={() => {
          closeSidebar()
        }}
        sx={{
          "backgroundColor": isCurrentPath(href) ? "rgba(0, 0, 0, 0.08)" : "transparent",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.08)",
          },
          "&::before": {
            content: isCurrentPath(href) ? '""' : "none",
            position: "absolute",
            top: 0,
            left: 0,
            width: "4px",
            height: "100%",
            backgroundColor: "var(--primaryColor)",
          },
        }}
      >
        {icon}
        <Typography level="title-md">
          {badge ? (
            <Badge
              sx={{
                ".MuiBadge-badge": {
                  backgroundColor: "var(--primaryColor)",
                  borderColor: "transparent",
                  transform: "translate(46.5px, -9px)",
                },
              }}
              badgeContent={badge}
            >
              {label}
            </Badge>
          ) : (
            label
          )}
        </Typography>
      </ListItemButton>
    </ListItem>
  </Link>
)
