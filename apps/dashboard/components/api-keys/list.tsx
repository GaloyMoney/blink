import React from "react"
import Table from "@mui/joy/Table"
import Typography from "@mui/joy/Typography"
import Divider from "@mui/joy/Divider"

import RevokeKey from "./revoke"
import { formatDate, getScopeText } from "./utils"

import { ApiKey } from "@/services/graphql/generated"

interface ApiKeysListProps {
  activeKeys: ApiKey[]
  expiredKeys: ApiKey[]
  revokedKeys: ApiKey[]
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
            <th style={{ width: "25%" }}>API Key ID</th>
            <th style={{ width: "15%" }}>Scope</th>
            <th style={{ width: "15%" }}>Expires At</th>
            <th style={{ width: "15%" }}>Last Used</th>
            <th style={{ width: "5%", textAlign: "right" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {activeKeys.map(({ id, name, expiresAt, lastUsedAt, scopes }) => {
            return (
              <tr key={id}>
                <td>{name}</td>
                <td>{id}</td>
                <td>{getScopeText(scopes)}</td>
                <td>{expiresAt ? formatDate(expiresAt) : "Never"}</td>
                <td>{lastUsedAt ? formatDate(lastUsedAt) : "Never"}</td>
                <td style={{ textAlign: "right" }}>
                  <RevokeKey id={id} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </Table>
      {activeKeys.length === 0 && <Typography>No active keys to display.</Typography>}

      <Divider />

      <Typography fontSize={22}>Revoked Keys</Typography>
      <Table aria-label="revoked keys table">
        <thead>
          <tr>
            <th style={{ width: "20%" }}>Name</th>
            <th style={{ width: "25%" }}>API Key ID</th>
            <th style={{ width: "15%" }}>Scope</th>
            <th style={{ width: "20%" }}>Created At</th>
            <th style={{ textAlign: "right", width: "15%" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {revokedKeys.map(({ id, name, createdAt, scopes }) => (
            <tr key={id}>
              <td>{name}</td>
              <td>{id}</td>
              <td>{getScopeText(scopes)}</td>
              <td>{formatDate(createdAt)}</td>
              <td style={{ textAlign: "right" }}>Revoked</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {revokedKeys.length === 0 && <Typography>No revoked keys to display.</Typography>}

      <Divider />

      {/* Expired Keys Section */}
      <Typography fontSize={22}>Expired Keys</Typography>
      <Table aria-label="expired keys table">
        <thead>
          <tr>
            <th style={{ width: "20%" }}>Name</th>
            <th style={{ width: "25%" }}>API Key ID</th>
            <th style={{ width: "15%" }}>Scope</th>
            <th style={{ width: "20%" }}>Created At</th>
            <th style={{ textAlign: "right", width: "15%" }}>Expires At</th>
          </tr>
        </thead>
        <tbody>
          {expiredKeys.map(({ id, name, createdAt, expiresAt, scopes }) => (
            <tr key={id}>
              <td>{name}</td>
              <td>{id}</td>
              <td>{getScopeText(scopes)}</td>
              <td>{formatDate(createdAt)}</td>
              <td style={{ textAlign: "right" }}>
                {expiresAt ? formatDate(expiresAt) : "Never"}
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
