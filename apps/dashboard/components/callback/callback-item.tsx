"use client"
import React from "react"

import { Box, Card, Typography } from "@mui/joy"

import DeleteCallback from "./callback-delete"

type CallbackEndpointProps = {
  id: string
  url: string
}

function callbackItem({ id, url }: CallbackEndpointProps) {
  return (
    <Card
      id={id}
      sx={{
        "display": "flex",
        "flexDirection": "row",
        "alignItems": "center",
        "justifyContent": "space-between",
        "padding": 2,
        "borderRadius": 1,
        "boxShadow": 1,
        "&:hover": {
          boxShadow: 3,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          boxShadow: 0.5,
          gap: "1em",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.5em",
            justifyContent: "space-between",
            padding: "0.4em",
            borderRadius: "0.5em",
            backgroundColor: "neutral.solidDisabledBg",
          }}
        >
          {id}
        </Box>

        <Typography
          sx={{
            fontWeight: "bold",
          }}
        >
          {url}
        </Typography>
      </Box>
      <DeleteCallback id={id}></DeleteCallback>
    </Card>
  )
}

export default callbackItem
