import React from "react"

import { Box } from "@mui/joy"

import BatchPayments from "@/components/batch-payments"

import ContentContainer from "@/components/content-container"

export default function page() {
  return (
    <ContentContainer>
      <Box
        sx={{
          maxWidth: "90em",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <BatchPayments />
      </Box>
    </ContentContainer>
  )
}
