"use client"
import React, { useEffect } from "react"

import { useSearchParams } from "next/navigation"

import { useCurrencyListQuery } from "../../lib/graphql/generated"

export default function CurrencyDropdown({
  onSelectedDisplayCurrencyChange,
  name,
  showOnlyFlag = false,
}: {
  onSelectedDisplayCurrencyChange?: (newDisplayCurrency: string) => void
  name?: string
  style?: React.CSSProperties
  showOnlyFlag?: boolean
}) {
  const searchParams = useSearchParams()
  const display = searchParams?.get("displayCurrency")

  const { data: currencyData } = useCurrencyListQuery()

  const [selectedDisplayCurrency, setSelectedDisplayCurrency] = React.useState("USD")
  const [isDropDownOpen, setIsDropDownOpen] = React.useState(false)

  useEffect(() => {
    const newDisplay =
      display && typeof display === "string"
        ? display
        : localStorage.getItem("displayCurrency") ?? "USD"
    setSelectedDisplayCurrency(newDisplay)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    // TODO auto-complete input can be better here Instead of select dropdown
    <select
      className="bg-slate-200 border-none p-2 w-20 rounded-md"
      name={name ?? "displayCurrency"}
      required
      value={selectedDisplayCurrency}
      onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
        const currencyId = event.target.value
        const newDisplayCurrency = currencyData?.currencyList?.find(
          (item) => item.id === currencyId,
        )
        if (newDisplayCurrency) {
          setSelectedDisplayCurrency(newDisplayCurrency.id)
        }
        if (onSelectedDisplayCurrencyChange) {
          onSelectedDisplayCurrencyChange(newDisplayCurrency?.id ?? "USD")
        }
        setIsDropDownOpen(false)
      }}
      onFocus={() => {
        setIsDropDownOpen(true)
      }}
      onBlur={() => {
        setIsDropDownOpen(false)
      }}
    >
      {currencyData?.currencyList?.map((option) => {
        const fullLabel = `${option.id} - ${option.name} ${
          option.flag ? option.flag : ""
        }`
        const flagOnlyLabel = option.flag ? option.flag : option.id
        const isSelected = selectedDisplayCurrency === option.id
        return (
          <option key={option.id} value={option.id}>
            {isDropDownOpen && fullLabel}
            {!isDropDownOpen &&
              (isSelected ? (showOnlyFlag ? flagOnlyLabel : option.id) : fullLabel)}
          </option>
        )
      })}
    </select>
  )
}
