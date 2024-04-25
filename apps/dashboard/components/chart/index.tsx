"use client"
import { Box, Card } from "@mui/joy"
import React from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const TransactionChart = ({ usdTransactions, btcTransactions }) => {
  const data = usdTransactions.map((usd, index) => ({
    date: new Date(usd.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    }),
    USD: (usd.balance / 100).toFixed(2),
  }))

  const usdValues = data.map((item) => parseFloat(item.USD))
  const minY = Math.min(...usdValues)
  const maxY = Math.max(...usdValues)
  const padding = 10
  const domainMin = minY - padding
  const domainMax = maxY + padding

  return (
    <Card
      sx={{
        marginTop: "0.5em",
      }}
    >
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis domain={[domainMin, domainMax]} />
          <Tooltip labelStyle={{ color: "black" }} />
          <Line type="monotone" dataKey="USD" stroke="#fe990d" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

export default TransactionChart
