import { Box } from "@mui/material"
import React from "react"

type DetailsProps = {
  label: string
  value: string
}

function Details({ label, value }: DetailsProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <Box
        sx={{
          fontSize: "0.9em",
        }}
      >
        {label}
      </Box>
      <Box
        sx={{
          fontWeight: "500",
        }}
      >
        {value}
      </Box>
    </Box>
  )
}

export default Details
