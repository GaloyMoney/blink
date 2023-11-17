import React from "react"
import Table from "@mui/joy/Table"

import { Typography } from "@mui/joy"

import DeleteCallback from "./callback-delete"

type EndPointProps = {
  readonly id: string
  readonly url: string
}

type EndPointCardListProps = {
  endpoints: readonly EndPointProps[]
}

const CallBackList = async ({ endpoints }: EndPointCardListProps) => {
  return (
    <>
      <Table aria-label="basic table" sx={{ width: "100%" }}>
        <thead>
          <tr>
            <th style={{ width: "30%", wordBreak: "break-word", wordWrap: "break-word" }}>
              ID
            </th>
            <th style={{ width: "60%", wordBreak: "break-word", wordWrap: "break-word" }}>
              Endpoint URL
            </th>
            <th
              style={{
                width: "10%",
                textAlign: "right",
                wordBreak: "break-word",
                wordWrap: "break-word",
              }}
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {endpoints.map(({ id, url }) => (
            <tr key={id} data-testid={id}>
              <td style={{ wordBreak: "break-word", wordWrap: "break-word" }}>{id}</td>
              <td style={{ wordBreak: "break-word", wordWrap: "break-word" }}>{url}</td>
              <td
                style={{
                  textAlign: "right",
                  wordBreak: "break-word",
                  wordWrap: "break-word",
                }}
              >
                <DeleteCallback id={id} />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {endpoints.length === 0 && <Typography>No Callbacks Added</Typography>}
    </>
  )
}

export default CallBackList
