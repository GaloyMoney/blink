import { ParsedUrlQuery } from "querystring"
import { URL } from "url"

export const usdFormatter = new Intl.NumberFormat("en-US", {
  // style: "currency",
  // currency: "USD",
  maximumFractionDigits: 0,
})

export const satsFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

export function formatOperand(operand: string | undefined, defaultValue?: string) {
  if (operand == null || isNaN(Number(operand))) return defaultValue ?? `0.00`
  const [integer, decimal] = operand.split(".")
  if (decimal == null) {
    return usdFormatter.format(Number(integer))
  }
  return `${usdFormatter.format(Number(integer))}.${decimal}`
}

export function parseQueryAmount(query: ParsedUrlQuery) {
  const currency = query.currency as string | null

  return {
    amount: Number(query.amount) || 0,
    currency: currency?.toUpperCase() || "USD",
  }
}

export function parseDisplayCurrency(query: ParsedUrlQuery) {
  const display = query.display as string | null

  return {
    display: display ?? localStorage.getItem("display") ?? "USD",
  }
}

export const getOriginalRequestInfo = (request: Request) => {
  const url = new URL(request.url)
  const hostname = request.headers.get("x-forwarded-host")
    ? request.headers.get("x-forwarded-host")?.split(":")[0]
    : url.hostname
  const protocol =
    request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "")
  const port = request.headers.get("x-forwarded-port") ?? url.port

  return {
    hostname,
    protocol,
    port,
  }
}

export function safeAmount(amount: number | string | string[] | undefined) {
  try {
    if (isNaN(Number(amount))) return 0
    const theSafeAmount = (
      amount !== "NaN" &&
      amount !== undefined &&
      amount !== "" &&
      typeof amount === "string"
        ? !amount?.includes("NaN")
        : true
    )
      ? amount
      : 0
    return Number(theSafeAmount)
  } catch (e) {
    return 0
  }
}

type LocaleConfig = {
  currencySymbol: string
  groupSeparator: string
  decimalSeparator: string
  prefix: string
  suffix: string
}

type IntlConfig = {
  locale: string
  currency?: string
}

const defaultConfig: LocaleConfig = {
  currencySymbol: "",
  groupSeparator: "",
  decimalSeparator: "",
  prefix: "",
  suffix: "",
}

export const getLocaleConfig = (intlConfig?: IntlConfig): LocaleConfig => {
  const { locale, currency } = intlConfig || {}
  const numberFormatter = locale
    ? new Intl.NumberFormat(
        locale,
        currency ? { currency, style: "currency" } : undefined,
      )
    : new Intl.NumberFormat()

  return numberFormatter.formatToParts(1000.1).reduce((prev, curr, i): LocaleConfig => {
    if (curr.type === "currency") {
      if (i === 0) {
        return { ...prev, currencySymbol: curr.value, prefix: curr.value }
      } else {
        return { ...prev, currencySymbol: curr.value, suffix: curr.value }
      }
    }
    if (curr.type === "group") {
      return { ...prev, groupSeparator: curr.value }
    }
    if (curr.type === "decimal") {
      return { ...prev, decimalSeparator: curr.value }
    }

    return prev
  }, defaultConfig)
}
