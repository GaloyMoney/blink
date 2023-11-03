import React from "react"
import Table from "@mui/joy/Table"

import { getServerSession } from "next-auth"

import { redirect } from "next/navigation"
import { Divider, Typography } from "@mui/joy"

import RevokeKey from "./revoke"

import { apiKeys } from "@/services/graphql/queries/api-keys"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const formatDate = (timestamp: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }
  return new Date(parseInt(timestamp) * 1000).toLocaleDateString(undefined, options)
}

const ApiKeysList = async () => {
  const session = await getServerSession(authOptions)
  const token = session?.accessToken

  if (!token || typeof token !== "string") {
    redirect("/")
  }

  const keys = await apiKeys(token)

  const activeKeys = keys.filter(({ expired, revoked }) => !expired && !revoked)
  const expiredKeys = keys.filter(({ expired }) => expired)
  const revokedKeys = keys.filter(({ revoked }) => revoked)

  return (
    <>
      <Typography fontSize={22}>Active Keys</Typography>
      <Table aria-label="basic table">
        <thead>
          <tr>
            <th>Name</th>
            <th>API Key ID</th>
            <th>Expires At</th>
            <th>Last Used</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {activeKeys.map(({ id, name, expiresAt, lastUsedAt }) => (
            <tr key={id}>
              <td>{name}</td>
              <td>{id}</td>
              <td>{formatDate(expiresAt)}</td>
              <td>{lastUsedAt ? formatDate(lastUsedAt) : "Never"}</td>
              <td>
                <RevokeKey id={id} />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {activeKeys.length === 0 && <Typography>No keys to display.</Typography>}

      <Divider />

      <Typography fontSize={22}>Revoked Keys</Typography>
      <Table aria-label="basic table">
        <thead>
          <tr>
            <th>Name</th>
            <th>API Key ID</th>
            <th>Created At</th>
            <th>Last Used</th>
          </tr>
        </thead>
        <tbody>
          {revokedKeys.map(({ id, name, expiresAt, createdAt }) => (
            <tr key={id}>
              <td>{name}</td>
              <td>{id}</td>
              <td>{formatDate(createdAt)}</td>
              <td>{formatDate(expiresAt)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {revokedKeys.length === 0 && <Typography>No keys to display.</Typography>}

      <Divider />

      <Typography fontSize={22}>Expired Keys</Typography>
      <Table aria-label="basic table">
        <thead>
          <tr>
            <th>Name</th>
            <th>API Key ID</th>
            <th>Created At</th>
            <th>Last Used</th>
          </tr>
        </thead>
        <tbody>
          {expiredKeys.map(({ id, name, expiresAt, createdAt }) => (
            <tr key={id}>
              <td>{name}</td>
              <td>{id}</td>
              <td>{formatDate(createdAt)}</td>
              <td>{formatDate(expiresAt)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {expiredKeys.length === 0 && <Typography>No keys to display.</Typography>}
    </>
  )
}

export default ApiKeysList
