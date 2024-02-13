import React from "react"

import AppLayout from "@/components/Layouts/AppLayout"

export default function UserNameLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: {
    username: string
  }
}) {
  return <AppLayout username={params.username}>{children}</AppLayout>
}
