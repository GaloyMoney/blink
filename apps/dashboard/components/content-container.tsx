import { Box } from "@mui/joy"
import React from "react"

interface ContentContainerProps {
  children: React.ReactNode
}

function ContentContainer({ children }: ContentContainerProps) {
  return (
    <Box
      component="main"
      className="MainContent"
      sx={{
        px: {
          xs: 2,
          md: 6,
        },
        pt: {
          xs: 3,
          sm: 3,
          md: 3,
        },
        pb: {
          xs: 2,
          sm: 2,
          md: 3,
        },
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        gap: 1,
      }}
    >
      {children}
    </Box>
  )
}

export default ContentContainer
