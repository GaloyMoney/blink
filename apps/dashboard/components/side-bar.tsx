"use client";
import GlobalStyles from "@mui/joy/GlobalStyles";
import Box from "@mui/joy/Box";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton, { listItemButtonClasses } from "@mui/joy/ListItemButton";
import Sheet from "@mui/joy/Sheet";
import Divider from "@mui/material/Divider"; // Import Divider
import Link from "next/link";
import { closeSidebar } from "./utils";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import HomeIcon from "@mui/icons-material/Home";
import Logo from "./logo";

export default function Sidebar() {
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
        p: 2,
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
            gap: 2,
          },
        }}
      >
        <Box
          sx={{
            alignItems: "flex-start", 
            display: "flex",
            padding:"0.1em"
          }}
        >
          <Logo />
        </Box>
        <Divider 
        sx={{
          marginBottom : '1em'

        }}
        /> 
        <List
          sx={{
            "& .MuiListItem-root": {
              mb: 2,
            },
          }}
        >
          <Link href={`/`}>
            <ListItem  
            >
              <ListItemButton>
                <HomeIcon />
                Home
              </ListItemButton>
            </ListItem>
          </Link>
          <Link href={`/transaction`}>
            <ListItem sx={{}}>
              <ListItemButton>
                <ReceiptLongIcon />
                Transaction
              </ListItemButton>
            </ListItem>
          </Link>
        </List>
      </Box>
    </Sheet>
  );
}
