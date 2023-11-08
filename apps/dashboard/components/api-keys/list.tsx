import React from "react"
import Table from "@mui/joy/Table"
import Typography from "@mui/joy/Typography"
import Divider from "@mui/joy/Divider"

import RevokeKey from "./revoke"

interface ApiKey {
  id: string
  name: string
  createdAt: string
  expiresAt: string
  lastUsedAt?: string | null
}

interface ApiKeysListProps {
  activeKeys: ApiKey[]
  expiredKeys: ApiKey[]
  revokedKeys: ApiKey[]
}

const formatDate = (timestamp: number): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }
  return new Date(timestamp * 1000).toLocaleDateString(undefined, options)
}

const ApiKeysList: React.FC<ApiKeysListProps> = ({
  activeKeys,
  expiredKeys,
  revokedKeys,
}) => {
  return (
    <>
      <Typography fontSize={22}>Active Keys</Typography>
      <Table aria-label="active keys table">
        <thead>
          <tr>
            <th style={{ width: "20%" }}>Name</th>
            <th style={{ width: "30%" }}>API Key ID</th>
            <th style={{ width: "20%" }}>Expires At</th>
            <th style={{ width: "20%" }}>Last Used</th>
            <th style={{ width: "10%", textAlign: "right" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {activeKeys.map(({ id, name, expiresAt, lastUsedAt }) => (
            <tr key={id}>
              <td style={{ width: "20%" }}>{name}</td>
              <td style={{ width: "30%" }}>{id}</td>
              <td style={{ width: "20%" }}>{formatDate(expiresAt)}</td>
              <td style={{ width: "20%" }}>
                {lastUsedAt ? formatDate(lastUsedAt) : "Never"}
              </td>
              <td style={{ width: "10%", textAlign: "right" }}>
                <RevokeKey id={id} />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {activeKeys.length === 0 && <Typography>No active keys to display.</Typography>}

      <Divider />

      <Typography fontSize={22}>Revoked Keys</Typography>
      <Table aria-label="revoked keys table">
        <thead>
          <tr>
            <th style={{ width: "25%" }}>Name</th>
            <th style={{ width: "35%" }}>API Key ID</th>
            <th style={{ width: "15%" }}>Created At</th>
            <th style={{ textAlign: "right", width: "15%" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {revokedKeys.map(({ id, name, createdAt }) => (
            <tr key={id}>
              <td style={{ width: "25%" }}>{name}</td>
              <td style={{ width: "35%" }}>{id}</td>
              <td style={{ width: "15%" }}>{formatDate(createdAt)}</td>
              <td style={{ textAlign: "right", width: "15%" }}>Revoked</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {revokedKeys.length === 0 && <Typography>No revoked keys to display.</Typography>}

      <Divider />

      <Typography fontSize={22}>Expired Keys</Typography>
      <Table aria-label="expired keys table">
        <thead>
          <tr>
            <th style={{ width: "25%" }}>Name</th>
            <th style={{ width: "35%" }}>API Key ID</th>
            <th style={{ width: "20%" }}>Created At</th>
            <th style={{ textAlign: "right", width: "15%" }}>Expires At</th>
          </tr>
        </thead>
        <tbody>
          {expiredKeys.map(({ id, name, createdAt, expiresAt }) => (
            <tr key={id}>
              <td style={{ width: "25%" }}>{name}</td>
              <td style={{ width: "35%" }}>{id}</td>
              <td style={{ width: "20%" }}>{formatDate(createdAt)}</td>
              <td style={{ textAlign: "right", width: "15%" }}>
                {formatDate(expiresAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {expiredKeys.length === 0 && <Typography>No expired keys to display.</Typography>}
    </>
  )
}

export default ApiKeysList
