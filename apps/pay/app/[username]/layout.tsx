import React from "react"

import UsernameLayoutContainer from "@/components/Layouts/UsernameLayout"

export default function UsernameLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: {
    username: string
  }
}) {
  return (
    <UsernameLayoutContainer username={params.username}>
      {children}
    </UsernameLayoutContainer>
  )
}
