"use client"
import React, { useEffect, useState } from "react"
import Select, {
  CSSObjectWithLabel,
  SingleValue,
  StylesConfig,
  OptionProps,
} from "react-select"
import { useSearchParams } from "next/navigation"

import { useCurrencyListQuery } from "../../lib/graphql/generated"

import { useInvoiceContext } from "@/context/invoice-context"
import { satCurrencyMetadata } from "@/app/sats-currency-metadata"

type OptionType = {
  value: string
  label: string
}

type CurrencyDropdownProps = {
  onSelectedDisplayCurrencyChange?: (newDisplayCurrency: string) => void
  name?: string
  style?: React.CSSProperties
  showOnlyFlag?: boolean
  menuPlacement?: "auto" | "bottom" | "top"
}

const CurrencyDropdown: React.FC<CurrencyDropdownProps> = ({
  onSelectedDisplayCurrencyChange,
  name,
  showOnlyFlag = false,
  menuPlacement = "auto",
}) => {
  const searchParams = useSearchParams()
  const display = searchParams?.get("display")
  const { state } = useInvoiceContext()
  const { data: currencyData } = useCurrencyListQuery()

  const [selectedOption, setSelectedOption] = useState<OptionType | null>(null)

  useEffect(() => {
    const defaultDisplay = display || localStorage.getItem("display") || "USD"
    let currencies = currencyData?.currencyList || []

    // add sats currency metadata if the wallet currency is not USD
    if (state.walletCurrency !== "USD") {
      currencies = [...currencies, satCurrencyMetadata]
    }

    const initialCurrency = currencies.find(({ id }) => id === defaultDisplay)
    setSelectedOption(
      initialCurrency
        ? {
            value: initialCurrency.id,
            label: `${initialCurrency.id} - ${initialCurrency.name}`,
          }
        : null,
    )
  }, [display, currencyData?.currencyList, state.walletCurrency]) // Ensure walletCurrency is a dependency

  const handleOnChange = (option: SingleValue<OptionType>) => {
    const newDisplayCurrency = option ? option.value : "USD"
    setSelectedOption(option as OptionType)
    if (onSelectedDisplayCurrencyChange) {
      onSelectedDisplayCurrencyChange(newDisplayCurrency)
    }
  }

  const options: OptionType[] =
    (currencyData?.currencyList || [])
      .concat(state.walletCurrency !== "USD" ? [satCurrencyMetadata] : [])
      .map((currency) => ({
        value: currency.id,
        label:
          showOnlyFlag && currency.flag
            ? `${currency.flag}`
            : `${currency.id} - ${currency.name} ${currency.flag}`,
      })) || []

  const customStyles: StylesConfig<OptionType, false> = {
    container: (base: CSSObjectWithLabel) => {
      return {
        ...base,
        width: "100%",
      } as CSSObjectWithLabel
    },
    control: (base: CSSObjectWithLabel) => {
      return {
        ...base,
        backgroundColor: "var(--lighterGrey)",
        border: "none",
        boxShadow: "none",
      } as CSSObjectWithLabel
    },
    option: (base: CSSObjectWithLabel, state: OptionProps<OptionType, false>) => {
      return {
        ...base,
        backgroundColor: state.isFocused ? "var(--primaryColor)" : undefined,
        color: state.isFocused ? "white" : "black",
      } as CSSObjectWithLabel
    },
  }

  return (
    <Select
      className="react-select-container"
      classNamePrefix="react-select"
      name={name ?? "display"}
      value={selectedOption}
      onChange={handleOnChange}
      options={options}
      isSearchable
      placeholder="Select a currency..."
      styles={customStyles}
      menuPlacement={menuPlacement}
    />
  )
}

export default CurrencyDropdown
