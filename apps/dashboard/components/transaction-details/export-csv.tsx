"use client"
import { Button } from "@mui/joy"

import { TransactionDetailsProps } from "./index.types"

export default function ExportCsv({ rows }: TransactionDetailsProps) {
  const exportCsvHandler = () => {
    let csvContent = "data:text/csv;charset=utf-8,"

    csvContent += "Transaction Date,Settle Amount,Wallet Type,Status,Fees\n"
    rows.forEach((row) => {
      let transactionDate = new Date(row.node.createdAt * 1000).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })

      let status = row.node.status.toLowerCase()
      let fees = `${row.node.settlementFee} stats`
      let formattedTransactionDate = `"${transactionDate}"`

      let rowData = [
        formattedTransactionDate,
        `${row.node.settlementDisplayAmount} ${row.node.settlementDisplayCurrency}`,
        row.node.settlementCurrency,
        status,
        fees,
      ].join(",")

      csvContent += rowData + "\n"
    })

    var encodedUri = encodeURI(csvContent)
    var link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "transactions.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button
      sx={{
        maxWidth: "10em",
      }}
      onClick={exportCsvHandler}
    >
      Download CSV
    </Button>
  )
}
