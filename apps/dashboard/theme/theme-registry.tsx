"use client"
import * as React from "react"
import { CssVarsProvider } from "@mui/joy/styles"
import InitColorSchemeScript from "@mui/joy/InitColorSchemeScript"
import CssBaseline from "@mui/joy/CssBaseline"

import NextAppDirEmotionCacheProvider from "./emotion-cache"
import theme from "./theme"

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <NextAppDirEmotionCacheProvider options={{ key: "joy" }}>
      <InitColorSchemeScript />
      <CssVarsProvider defaultMode="system" theme={theme}>
        <CssBaseline />
        {children}
      </CssVarsProvider>
    </NextAppDirEmotionCacheProvider>
  )
}
