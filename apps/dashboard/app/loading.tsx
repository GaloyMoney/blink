import { CircularProgress } from "@mui/joy"
import React from "react"

function Loading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <CircularProgress />
    </div>
  )
}

export default Loading
