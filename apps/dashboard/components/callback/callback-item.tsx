import React from "react"
import { Card, Typography, Box } from "@mui/joy"

import DeleteCallback from "./callback-delete"

type EndPointProps = {
  readonly id: string
  readonly url: string
}

type EndPointCardListProps = {
  endpoints: readonly EndPointProps[]
}

const CallBackCardItem = ({ endpoints }: EndPointCardListProps) => {
  return (
    <>
      {endpoints.map(({ id, url }) => (
        <Card
          key={id}
          sx={{
            "display": "flex",
            "flexDirection": "column",
            "alignItems": "flex-start",
            "borderRadius": "1em",
            "boxShadow": 1,
            "marginBottom": "1em",
            "&:hover": {
              boxShadow: 3,
            },
          }}
        >
          <Box
            sx={{
              width: "100%",
              padding: 0.5,
            }}
          >
            <Typography>ID</Typography>
            <Typography
              sx={{
                fontWeight: "bold",
                whiteSpace: "nowrap",
                overflow: "hidden",
                backgroundColor: "neutral.solidDisabledBg",
                textOverflow: "ellipsis",
                padding: 1,
                borderRadius: "0.5em",
              }}
            >
              {id}
            </Typography>
          </Box>

          <Box
            sx={{
              width: "100%",
              padding: 0.5,
            }}
          >
            <Typography>URL</Typography>
            <Typography
              sx={{
                fontWeight: "bold",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                backgroundColor: "neutral.solidDisabledBg",
                padding: 1,
                borderRadius: "0.5em",
              }}
            >
              {url}
            </Typography>
          </Box>

          <DeleteCallback id={id}></DeleteCallback>
        </Card>
      ))}
      {endpoints.length === 0 && <Typography>No Callbacks Added</Typography>}
    </>
  )
}

export default CallBackCardItem
