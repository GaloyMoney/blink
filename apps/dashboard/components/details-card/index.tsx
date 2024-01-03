import { Card } from "@mui/joy"
import React from "react"

type DetailsCardProps = {
  children: React.ReactNode
}

function DetailsCard({ children }: DetailsCardProps) {
  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
        width: "100%",
      }}
    >
      {children}
    </Card>
  )
}

export default DetailsCard
