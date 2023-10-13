"use client";
import * as React from "react";
import GlobalStyles from "@mui/joy/GlobalStyles";
import IconButton from "@mui/joy/IconButton";
import Sheet from "@mui/joy/Sheet";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { toggleSidebar } from "./utils";
import Heading from "./Heading";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { Avatar, Box, Menu, MenuItem, Dropdown, MenuButton } from "@mui/joy";
import { useSession } from "next-auth/react";

export default function Header() {
    const session = useSession();
    const userData = session?.data?.userData?.data?.me;

    if (!userData) {
        return null;
    }

    return (
        <Sheet
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                top: 0,
                width: {
                    xs: "100vw",
                    md: "calc(100vw - var(--Sidebar-width))",
                },
                height: "var(--Header-height)",
                zIndex: 9998,
                p: 2,
                gap: 1,
                borderBottom: "2px solid",
                borderColor: "background.level1",
                backgroundColor: "white",
            }}
        >
            <GlobalStyles
                styles={(theme) => ({
                    ":root": {
                        "--Header-height": "4em",
                    },
                })}
            />
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1em",
                }}
            >
                <IconButton
                    onClick={() => toggleSidebar()}
                    variant="outlined"
                    color="neutral"
                    size="sm"
                    sx={{ display: { xs: "block", md: "none" } }}
                >
                    <MenuRoundedIcon />
                </IconButton>
                <Heading />
            </Box>

            <Dropdown>
                <MenuButton
                    slots={{ root: IconButton }}
                    slotProps={{
                        root: { variant: "outlined", color: "neutral" },
                    }}
                    sx={{ border: "none" }}
                >
                    <Avatar />
                </MenuButton>
                <Menu
                    sx={{
                        zIndex: 9999,
                    }}
                    placement="bottom-end"
                >
                    <MenuItem
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1em",
                            alignItems: "flex-start",
                        }}
                    >
                        <span>User Id</span>
                        <span> {userData?.id}</span>
                    </MenuItem>
                    <MenuItem
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        Logout
                        <LogoutOutlinedIcon></LogoutOutlinedIcon>
                    </MenuItem>
                </Menu>
            </Dropdown>
        </Sheet>
    );
}
