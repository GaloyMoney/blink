import React from "react"
import Table from "@mui/joy/Table"
import { Button } from "@mui/joy"
import DownloadIcon from "@mui/icons-material/Download"

const SampleCSVTable = () => {
  const createCsvContent = () => {
    const csvRows = [["username", "amount", "currency", "wallet", "memo"]]
    return csvRows.map((e) => e.join(",")).join("\n")
  }
  const handleDownload = () => {
    const csvContent = createCsvContent()
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "template.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Button
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          gap: "0.5em",
        }}
        variant="plain"
        onClick={handleDownload}
      >
        <DownloadIcon /> Download Template
      </Button>
      <Table
        sx={{
          "width": "100%",
          "border": "1px solid #ccc",
          "borderCollapse": "collapse",
          "& th, & td": {
            border: "1px solid #ccc",
            padding: "0.5em",
          },
        }}
        aria-label={`payments`}
      >
        <thead>
          <tr>
            <th>username</th>
            <th>amount</th>
            <th>currency</th>
            <th>wallet</th>
            <th>memo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>user1</td>
            <td>12</td>
            <td>USD</td>
            <td>USD</td>
            <td>sending $12 US with USD account</td>
          </tr>
          <tr>
            <td>user2</td>
            <td>12</td>
            <td>SATS</td>
            <td>BTC</td>
            <td>sending 12 Sats with BTC account</td>
          </tr>
          <tr>
            <td>user2</td>
            <td>20</td>
            <td>USD</td>
            <td>BTC</td>
            <td>sending $20 US with BTC account</td>
          </tr>
        </tbody>
      </Table>
    </>
  )
}

export default SampleCSVTable
