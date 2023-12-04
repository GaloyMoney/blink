"use client"
import React, { ReactNode } from "react"
import { ThemeProvider } from "next-themes"

interface Props {
  children: ReactNode
}

export default function Theme({ children }: Props) {
  return <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
}
