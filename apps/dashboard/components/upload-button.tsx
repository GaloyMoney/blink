import * as React from "react"
import SvgIcon from "@mui/joy/SvgIcon"
import { Button, Card } from "@mui/joy"

type FileUploadButtonProps = {
  setFile: (file: File | null) => void
  file: File | null
  processCsvLoading: boolean
  onFileProcessed: (file: File) => Promise<void>
  resetState: () => void
}

export default function FileUpload({
  setFile,
  file,
  processCsvLoading,
  onFileProcessed,
  resetState,
}: FileUploadButtonProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFile = event.target.files[0]
      setFile(selectedFile)
      await onFileProcessed(selectedFile)
      event.target.value = ""
    }
  }

  const handleDragOver = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    await handleDragOver(event)
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const droppedFile = event.dataTransfer.files[0]
      setFile(droppedFile)
      await onFileProcessed(droppedFile)
      event.dataTransfer.clearData()
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
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
          maxWidth: "70em",
          cursor: "pointer",
          minHeight: "13em",
          border: "2px dashed #ccc",
          margin: "0 auto",
          position: "relative",
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {processCsvLoading ? (
          <Button loading variant="plain"></Button>
        ) : (
          <>
            {file ? (
              <Button
                variant="outlined"
                color="danger"
                onClick={resetState}
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                }}
              >
                Clear
              </Button>
            ) : null}
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
            {file ? file.name : "Upload a csv file"}
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              accept=".csv"
              ref={fileInputRef}
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
