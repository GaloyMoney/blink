import React from "react"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"

export default function FundsPaid() {
  return (
    <>
      <CheckCircleIcon style={{ fontSize: 60, color: "#16ca40" }} />
      <div
        style={{
          fontSize: "1.3rem",
          fontWeight: 700,
          textAlign: "center",
          width: "90%",
        }}
      >
        Withdraw Link is Paid
      </div>
    </>
  )
}
