"use client"
import React, { useState } from "react"
import { Card, Button, ToggleButtonGroup, Box } from "@mui/joy"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts"

import { ProcessedTransaction } from "@/lib/index.types"

const CustomTooltip = ({
  active,
  payload,
}: TooltipProps<number, string>): JSX.Element | null => {
  if (active && payload && payload.length) {
    return (
      <Card style={{ padding: "1em" }}>
        <p>{payload[0].payload.dateTime}</p>
        <p>{`${payload[0].value}`}</p>
      </Card>
    )
  }
  return null
}
type Props = {
  usdTransactions: ProcessedTransaction[]
  btcTransactions: ProcessedTransaction[]
  maxBalance: {
    usd: number
    btc: number
  }
  minBalance: {
    usd: number
    btc: number
  }
}

const TransactionChart = ({
  usdTransactions,
  btcTransactions,
  maxBalance,
  minBalance,
}: Props) => {
  const [walletCurrency, setWalletCurrency] = useState("USD")
  const data = walletCurrency === "USD" ? usdTransactions : btcTransactions
  const minDomainY = walletCurrency === "USD" ? minBalance.usd : minBalance.btc
  const maxDomainY = walletCurrency === "USD" ? maxBalance.usd : maxBalance.btc

  const handleWalletChange = (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    newCurrency: string | null,
  ) => {
    if (newCurrency !== null) {
      setWalletCurrency(newCurrency)
    }
  }

  return (
    <Card sx={{ marginTop: "1.5rem" }}>
      {data.length ? (
        <>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", p: 2, width: "100%" }}
          >
            <ToggleButtonGroup
              value={walletCurrency}
              onChange={handleWalletChange}
              color="neutral"
            >
              <Button value="USD">Stablesats (USD)</Button>
              <Button value="BTC">BTC (Sats)</Button>
            </ToggleButtonGroup>
          </Box>
          <ResponsiveContainer
            width="100%"
            style={{
              padding: "0.6em",
            }}
            height={500}
          >
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fe990d" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#fe990d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                reversed={true}
                dataKey="date"
                minTickGap={100}
                tickMargin={10}
                padding={{ left: 20 }}
              />

              <YAxis
                domain={[minDomainY, maxDomainY]}
                padding={{ bottom: 20 }}
                dataKey="balance"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#fe990d"
                fill="url(#colorValue)"
                activeDot={{ r: 8 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </>
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <p>No data available</p>
        </Box>
      )}
    </Card>
  )
}

export default TransactionChart
