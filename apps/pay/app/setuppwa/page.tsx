"use client"
import { useRouter } from "next/navigation"
import React, { useEffect } from "react"

import CurrencyDropdown from "../../components/Currency/currency-dropdown"

const SetupPwa = () => {
  const router = useRouter()
  const [username, setUsername] = React.useState<string>("")

  let usernameFromLocal: string | null = null
  let displayCurrencyFromLocal: string | null = null

  useEffect(() => {
    usernameFromLocal = localStorage.getItem("username")
    displayCurrencyFromLocal = localStorage.getItem("display")
  }, [])

  const [selectedDisplayCurrency, setSelectedDisplayCurrency] = React.useState("USD")

  React.useEffect(() => {
    if (usernameFromLocal) {
      window.history.pushState(
        {},
        "",
        `${usernameFromLocal}??display=${displayCurrencyFromLocal}`,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usernameFromLocal])

  if (!usernameFromLocal || !displayCurrencyFromLocal) {
    return
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!usernameFromLocal) {
      localStorage.setItem("username", username)
    }

    if (!displayCurrencyFromLocal) {
      localStorage.setItem("display", selectedDisplayCurrency)
    }

    router.push(`${username}?display=${selectedDisplayCurrency}`)
  }

  if (!usernameFromLocal) {
    return (
      <div className="setup-pwa">
        <form
          className="username-form"
          autoComplete="off"
          onSubmit={(event: React.FormEvent<HTMLFormElement>) => handleSubmit(event)}
        >
          <h4>Welcome to Blink POS application.</h4>
          <label htmlFor="username">
            To use the app, enter the Blink username you would like to receive payments
            for.
          </label>
          <input
            type="text"
            name="username"
            value={username}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setUsername(event.target.value)
            }
            placeholder="username"
            required
          />
          <label htmlFor="display" style={{ alignSelf: "flex-start" }}>
            Enter your currency
          </label>
          <CurrencyDropdown
            name="display"
            style={{ height: "42px", width: "100%" }}
            onSelectedDisplayCurrencyChange={(newDisplayCurrency) => {
              if (newDisplayCurrency) {
                setSelectedDisplayCurrency(newDisplayCurrency)
              }
            }}
          />
          <button>Submit</button>
        </form>
      </div>
    )
  }
  return (
    <div className="loader-wrapper">
      <div className="loader"></div>
    </div>
  )
}

export default SetupPwa
