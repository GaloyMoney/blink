"use client"
import * as React from "react"
import SvgIcon from "@mui/joy/SvgIcon"
import { Button, Card } from "@mui/joy"

type FileUploadButtonProps = {
  setFile: (file: File | null) => void
  file: File | null
  processCsvLoading: boolean
}

export default function FileUpload({
  setFile,
  file,
  processCsvLoading,
}: FileUploadButtonProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0])
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      setFile(event.dataTransfer.files[0])
      event.dataTransfer.clearData()
    }
  }

  return (
    <label htmlFor="file-upload" style={{ width: "100%" }}>
      <Card
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          cursor: "pointer",
          minHeight: "13em",
          border: "2px dashed #ccc",
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {processCsvLoading ? (
          <Button loading variant="plain"></Button>
        ) : (
          <>
            <SvgIcon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                />
              </svg>
            </SvgIcon>
            {file ? file.name : "Upload a file"}
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              accept=".csv"
              style={{
                clip: "rect(0 0 0 0)",
                clipPath: "inset(50%)",
                height: "1px",
                overflow: "hidden",
                position: "absolute",
                whiteSpace: "nowrap",
                width: "1px",
              }}
            />
          </>
        )}
      </Card>
    </label>
  )
}
