"use client";
import GlobalStyles from "@mui/joy/GlobalStyles";
import Box from "@mui/joy/Box";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton, { listItemButtonClasses } from "@mui/joy/ListItemButton";
import Sheet from "@mui/joy/Sheet";
import Divider from "@mui/material/Divider";
import Link from "next/link";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { Typography } from "@mui/joy";
import { usePathname } from "next/navigation";
import Logo from "./logo";
import { closeSidebar } from "./utils";

export default function Sidebar() {
  const path = usePathname();
  const isCurrentPath = (href: string) => path === href;
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
      <Box
        className="Sidebar-overlay"
        sx={{
          position: "fixed",
          zIndex: 9998,
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          opacity: "var(--SideNavigation-slideIn)",
          backgroundColor: "var(--joy-palette-background-backdrop)",
          transition: "opacity 0.4s",
          transform: {
            xs: "translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1) + var(--SideNavigation-slideIn, 0) * var(--Sidebar-width, 0px)))",
            lg: "translateX(-100%)",
          },
          backdropFilter: "blur(10px)",
        }}
        onClick={() => closeSidebar()}
      />
      <Box
        sx={{
          minHeight: 0,
          overflow: "hidden auto",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          [`& .${listItemButtonClasses.root}`]: {
            gap: 1,
          },
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
          <Link href={`/`}>
            <ListItem>
              <ListItemButton
                onClick={() => {
                  closeSidebar();
                }}
                sx={{
                  backgroundColor: isCurrentPath("/")
                    ? "rgba(0, 0, 0, 0.08)"
                    : "transparent",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.08)",
                  },
                  "&::before": {
                    content: isCurrentPath("/") ? '""' : "none",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "4px",
                    height: "100%",
                    backgroundColor: "var(--primaryColor)",
                  },
                }}
              >
                <HomeOutlinedIcon />
                <Typography level="title-md">Home</Typography>
              </ListItemButton>
            </ListItem>
          </Link>
          <Link href={`/transactions`}>
            <ListItem>
              <ListItemButton
                onClick={() => {
                  closeSidebar();
                }}
                sx={{
                  backgroundColor: isCurrentPath("/transactions")
                    ? "rgba(0, 0, 0, 0.08)"
                    : "transparent",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.08)",
                  },
                  "&::before": {
                    content: isCurrentPath("/transactions") ? '""' : "none",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "4px",
                    height: "100%",
                    backgroundColor: "var(--primaryColor)",
                  },
                }}
              >
                <ReceiptLongIcon />
                <Typography level="title-md">Transactions</Typography>
              </ListItemButton>
            </ListItem>
          </Link>
        </List>
      </Box>
    </Sheet>
  );
}
