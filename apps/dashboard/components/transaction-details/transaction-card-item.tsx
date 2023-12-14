import * as React from "react"
import Card from "@mui/joy/Card"
import CardContent from "@mui/joy/CardContent"
import Typography from "@mui/joy/Typography"
import { Sheet } from "@mui/joy"
import Chip from "@mui/joy/Chip"

import { TransactionDetailsProps } from "./index.types"

import { getTransactionStatusColor } from "@/components/utils"

export default function TransactionCardComponent({ rows }: TransactionDetailsProps) {
  return (
    <Sheet
      variant="outlined"
      sx={{
        display: { xs: "initial", sm: "none" },
        width: "100%",
        borderRadius: "sm",
        flexShrink: 1,
        overflow: "auto",
        minHeight: 0,
      }}
    >
      {rows.map((row, index) => (
        <Card key={index} sx={{ margin: 2 }}>
          <CardContent>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <Typography level="body-sm" fontWeight="bold">
                ID
              </Typography>
              <Typography level="body-md">{row.node.id}</Typography>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <Typography level="body-sm" fontWeight="bold">
                Transaction Date
              </Typography>
              <Typography level="body-md">
                {new Date(row.node.createdAt * 1000).toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Typography>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <Typography level="body-sm" fontWeight="bold">
                Settle Amount
              </Typography>
              <Typography level="body-md">
                {row.node.settlementDisplayAmount} {row.node.settlementDisplayCurrency}
              </Typography>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <Typography level="body-sm" fontWeight="bold">
                Status
              </Typography>
              <Chip
                color={getTransactionStatusColor(row.node.status)}
                sx={{
                  backgroundColor: getTransactionStatusColor(row.node.status),
                }}
              >
                {row.node.status.toLowerCase()}
              </Chip>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <Typography level="body-sm" fontWeight="bold">
                Fees
              </Typography>
              <Typography level="body-md">{row.node.settlementFee} stats</Typography>
            </div>
          </CardContent>
        </Card>
      ))}
    </Sheet>
  )
}
