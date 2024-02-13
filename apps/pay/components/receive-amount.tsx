import { ParsedUrlQuery } from "querystring"

import React, { useState, useEffect } from "react"
import { useDebouncedCallback } from "use-debounce"
import { useParams, useRouter, useSearchParams } from "next/navigation"

import useSatPrice from "../lib/use-sat-price"

import { parseDisplayCurrency } from "../utils/utils"

import FormattedInput from "./formatted-input"
import GenerateInvoice from "./generate-invoice"

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const satsFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

export default function ReceiveAmount({
  recipientWalletId,
  recipientWalletCurrency,
}: {
  recipientWalletId: string
  recipientWalletCurrency: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { username } = useParams()
  const query = searchParams ? Object.fromEntries(searchParams.entries()) : {}
  const { satsToUsd, usdToSats } = useSatPrice()
  const { amount, currency } = parseQueryAmount(query) // USD or SATs
  const { display } = parseDisplayCurrency(query)

  function toggleCurrency() {
    const newCurrency = currency === "SATS" ? "USD" : "SATS"
    const newAmount =
      newCurrency === "SATS" ? Math.round(usdToSats(amount)) : satsToUsd(amount)

    router.push(
      getUpdatedURL(
        { ...query, username },
        { currency: newCurrency, amount: newAmount, display },
      ),
    )
  }

  const handleAmountUpdate = useDebouncedCallback(({ numberValue }) => {
    router.push(getUpdatedURL({ ...query, username }, { amount: numberValue }))
  }, 1000)

  const getSatsForInvoice = React.useCallback(() => {
    return Math.round(currency === "SATS" ? amount : Math.round(usdToSats(amount)))
  }, [amount, currency, usdToSats])
  const [satsForInvoice, setSatsForInvoice] = useState(() => getSatsForInvoice())

  const getCentsForInvoice = React.useCallback(() => {
    return Math.round(currency === "USD" ? amount * 100 : satsToUsd(amount) * 100)
  }, [amount, currency, satsToUsd])
  const [centsForInvoice, setCentsForInvoice] = useState(() => getCentsForInvoice())

  function triggerRegenerateUsdInvoice() {
    setCentsForInvoice(0)
    setTimeout(() => setCentsForInvoice(getCentsForInvoice()))
  }

  function triggerRegenerateBtcInvoice() {
    setSatsForInvoice(0)
    setTimeout(() => setSatsForInvoice(getSatsForInvoice()))
  }

  const convertedValue =
    currency === "SATS"
      ? usdFormatter.format(satsToUsd(amount))
      : satsFormatter.format(satsForInvoice) + " sats"

  useEffect(() => {
    const newSats = getSatsForInvoice()
    if (newSats !== satsForInvoice) setSatsForInvoice(newSats)
    const newCents = getCentsForInvoice()
    if (newCents !== centsForInvoice) setCentsForInvoice(newCents)
  }, [getSatsForInvoice, satsForInvoice, centsForInvoice, getCentsForInvoice])

  const amountInBase =
    recipientWalletCurrency === "USD" ? centsForInvoice : satsForInvoice
  const triggerRegenerateInvoice =
    recipientWalletCurrency === "USD"
      ? triggerRegenerateUsdInvoice
      : triggerRegenerateBtcInvoice
  return (
    <>
      <div className="amount-input">
        <div className="currency-label">{currency === "SATS" ? "sats" : "$"}</div>
        <div className="input-container">
          <FormattedInput
            key={currency}
            value={amount.toString()}
            onValueChange={handleAmountUpdate}
          />
        </div>
        <div className="toggle-currency" onClick={toggleCurrency}>
          &#8645;
        </div>
      </div>
      <div>&#8776; {convertedValue}</div>

      {amountInBase > 0 && (
        <GenerateInvoice
          recipientWalletId={recipientWalletId}
          recipientWalletCurrency={recipientWalletCurrency}
          amountInBase={amountInBase}
          regenerate={triggerRegenerateInvoice}
          currency={currency}
        />
      )}
    </>
  )
}

function parseQueryAmount(query: ParsedUrlQuery) {
  const currency = query.currency as string | null

  return {
    amount: Number(query.amount) || 0,
    currency: currency?.toUpperCase() || "USD",
  }
}

function getUpdatedURL(
  query: ParsedUrlQuery,
  update: Record<string, string | number>,
): string {
  const { username, ...params } = query

  const newEntries = Object.entries(params)
  const stringEntries = (newEntries || []).map(([k, v]) => [k, v?.toString()])
  const qs = new URLSearchParams(Object.fromEntries(stringEntries))

  Object.entries(update).forEach(([k, v]) => {
    qs.set(k, v.toString())
  })

  return `/${username}?${qs.toString()}`
}
