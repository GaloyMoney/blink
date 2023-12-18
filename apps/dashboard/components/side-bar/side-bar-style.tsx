import React from "react"
import GlobalStyles from "@mui/joy/GlobalStyles"

export const SidebarStyles: React.FC = () => (
  <GlobalStyles
    styles={(theme) => ({
      ":root": {
        "--Sidebar-width": "220px",
        [theme.breakpoints.up("lg")]: {
          "--Sidebar-width": "240px",
        },
      },
      ".Sidebar-overlay": {
        backdropFilter: "blur(10px)",
      },
    })}
  />
)
