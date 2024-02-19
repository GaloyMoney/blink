"use client"
import { useRouter } from "next/navigation"
import React, { Suspense, useEffect, useState } from "react"

import CurrencyDropdown from "../../components/currency/currency-dropdown"

const SetupPwa = () => {
  const router = useRouter()
  const [username, setUsername] = useState<string>("")
  const [usernameFromLocal, setUsernameFromLocal] = useState<string | null>(null)
  const [displayCurrencyFromLocal, setDisplayCurrencyFromLocal] = useState<string | null>(
    null,
  )

  useEffect(() => {
    const localUsername = localStorage.getItem("username")
    const localDisplayCurrency = localStorage.getItem("display")
    setUsernameFromLocal(localUsername)
    setDisplayCurrencyFromLocal(localDisplayCurrency)
  }, [])

  const [selectedDisplayCurrency, setSelectedDisplayCurrency] = useState("USD")

  useEffect(() => {
    if (usernameFromLocal && displayCurrencyFromLocal) {
      router.push(`${usernameFromLocal}?display=${displayCurrencyFromLocal}`)
    }
  }, [displayCurrencyFromLocal, usernameFromLocal])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!usernameFromLocal) {
      localStorage.setItem("username", username)
      setUsernameFromLocal(username)
    }

    if (!displayCurrencyFromLocal) {
      localStorage.setItem("display", selectedDisplayCurrency)
      setDisplayCurrencyFromLocal(selectedDisplayCurrency)
    }

    router.push(`${username}?display=${selectedDisplayCurrency}`)
  }

  if (!usernameFromLocal) {
    return (
      <div className="setup-pwa">
        <form className="username-form" autoComplete="off" onSubmit={handleSubmit}>
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
          <Suspense>
            <CurrencyDropdown
              name="display"
              style={{ height: "42px", width: "100%" }}
              onSelectedDisplayCurrencyChange={(newDisplayCurrency) => {
                setSelectedDisplayCurrency(newDisplayCurrency)
              }}
            />
          </Suspense>
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
