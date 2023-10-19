"use client"
import React from "react"
import { Box, Typography } from "@mui/joy"
import { usePathname } from "next/navigation"

import { URLS } from "@/app/url"

export function getTitle(path: string): string {
  const urlInfo = URLS[path]
  if (urlInfo) {
    return urlInfo.title
  }
  return "Path not found"
}

const Heading = () => {
  const pathName = usePathname()
  const title = getTitle(pathName)
  return (
    <Box
      sx={{
        display: "flex",
        my: 2,
        gap: 1,
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "start", sm: "center" },
        flexWrap: "wrap",
        justifyContent: "space-between",
      }}
    >
      <Typography level="h2">{title}</Typography>
    </Box>
  )
}

export default Heading
