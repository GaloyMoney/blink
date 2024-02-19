"use client"
import React, { useEffect } from "react"

import { useSearchParams } from "next/navigation"

import { useCurrencyListQuery } from "../../lib/graphql/generated"

export default function CurrencyDropdown({
  onSelectedDisplayCurrencyChange,
  name,
  style,
  showOnlyFlag = false,
}: {
  onSelectedDisplayCurrencyChange?: (newDisplayCurrency: string) => void
  name?: string
  style?: React.CSSProperties
  showOnlyFlag?: boolean
}) {
  const searchParams = useSearchParams()
  const display = searchParams?.get("display")

  const { data: currencyData } = useCurrencyListQuery()
  const [selectedDisplayCurrency, setSelectedDisplayCurrency] = React.useState("USD")
  const [isDropDownOpen, setIsDropDownOpen] = React.useState(false)

  useEffect(() => {
    const newDisplay =
      display && typeof display === "string"
        ? display
        : localStorage.getItem("display") ?? "USD"
    setSelectedDisplayCurrency(newDisplay)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <select
      style={style ?? { border: "none" }}
      name={name ?? "display"}
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
              (isSelected ? (showOnlyFlag ? flagOnlyLabel : fullLabel) : fullLabel)}
          </option>
        )
      })}
    </select>
  )
}
