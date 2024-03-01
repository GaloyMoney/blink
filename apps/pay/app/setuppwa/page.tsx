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
    if (router && usernameFromLocal && displayCurrencyFromLocal) {
      router.push(`${usernameFromLocal}?display=${displayCurrencyFromLocal}`)
    }
  }, [displayCurrencyFromLocal, usernameFromLocal, router])

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
      <div
        className="flex flex-col justify-center items-center h-screen"
        style={{ maxWidth: "90%", margin: "0 auto" }}
      >
        <h4>Welcome to Blink POS application.</h4>

        <form
          className="flex flex-col justify-center items-center"
          autoComplete="off"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col justify-center items-center w-full gap-2 rounded-md ">
            <p>
              To use the app, enter the Blink username you would like to receive payments
              for.
            </p>
            <div className="flex flex-col w-full">
              <label className="m-1" htmlFor="username">
                Blink username
              </label>
              <input
                className="w-full p-1.5 border-2 rounded-md bg-[var(--lighterGrey)]"
                type="text"
                name="username"
                value={username}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setUsername(event.target.value)
                }
                placeholder="username"
                required
              />
            </div>
            <div className="flex flex-col w-full">
              <label className="m-1" htmlFor="display">
                Currency
              </label>
              <Suspense fallback={<div>Loading...</div>}>
                <CurrencyDropdown
                  name="display"
                  onSelectedDisplayCurrencyChange={(newDisplayCurrency) => {
                    setSelectedDisplayCurrency(newDisplayCurrency)
                  }}
                />
              </Suspense>
            </div>
          </div>
          <button className="print-paycode-button w-1/2 m-2">Submit</button>
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
