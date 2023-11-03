import React from "react"
import Table from "@mui/joy/Table"

import { getServerSession } from "next-auth"

import { redirect } from "next/navigation"
import { Typography } from "@mui/joy"

import RevokeKey from "./revoke"

import { apiKeys } from "@/services/graphql/queries/api-keys"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const formatDate = (dateStr: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }
  return new Date(dateStr).toLocaleDateString(undefined, options)
}

const ApiKeysList = async () => {
  const session = await getServerSession(authOptions)
  const token = session?.accessToken

  if (!token || typeof token !== "string") {
    redirect("/")
  }

  const keys = await apiKeys(token)

  return (
    <>
      <Table aria-label="basic table">
        <thead>
          <tr>
            <th>API Key ID</th>
            <th>Name</th>
            <th>Created At</th>
            <th>Expiration Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {keys.map(({ id, name, createdAt, expiration }) => (
            <tr key={id}>
              <td>{id}</td>
              <td>{name}</td>
              <td>{formatDate(createdAt)}</td>
              <td>{formatDate(expiration)}</td>
              <td>
                <RevokeKey id={id} />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {keys.length === 0 && <Typography>No keys to display.</Typography>}
    </>
  )
}

export default ApiKeysList
