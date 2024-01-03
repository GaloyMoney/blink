import React from "react"
import Table from "@mui/joy/Table"
import { Box, Button } from "@mui/joy"
import DownloadIcon from "@mui/icons-material/Download"

const SampleCSVTable = () => {
  const createCsvContent = () => {
    const csvRows = [["username", "dollars", "memo"]]
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
      <Box
        sx={{
          maxWidth: "35em",
          margin: "0 auto",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "right",
            marginBottom: "0.2em",
          }}
        >
          <Button
            sx={{
              display: "flex",
              gap: "0.5em",
            }}
            variant="plain"
            onClick={handleDownload}
          >
            <DownloadIcon /> Download Template
          </Button>
        </Box>
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
              <th>dollars/sats</th>
              <th>memo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>user a</td>
              <td>12</td>
              <td>sample memo</td>
            </tr>
            <tr>
              <td>user b</td>
              <td>20</td>
              <td>sample memo</td>
            </tr>
            <tr>
              <td>user a</td>
              <td>30</td>
              <td>sample memo</td>
            </tr>
          </tbody>
        </Table>
      </Box>
    </>
  )
}

export default SampleCSVTable
