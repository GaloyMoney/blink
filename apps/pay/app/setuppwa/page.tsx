"use client"
import { useRouter } from "next/navigation"
import React, { Suspense, useEffect, useState } from "react"

import Image from "next/image"

import CurrencyDropdown from "../../components/currency/currency-dropdown"

import styles from "./setuppwa.module.css"

import LoadingComponent from "@/components/loading"

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
      <div className={styles.container}>
        <div className="flex flex-col justify-center items-center">
          <Image
            style={{
              marginLeft: "2em",
            }}
            src="BlinkPOS.svg"
            alt="Blink POS"
            width={220}
            height={220}
          ></Image>
          <p
            style={{
              maxWidth: "45ch",
              textAlign: "center",
              padding: "0.5em",
              marginTop: "0.5em",
            }}
          >
            To use the app, enter the Blink username you would like to receive payments
            for.
          </p>
        </div>
        <form
          className="flex flex-col justify-center items-center max-w-96 w-full"
          autoComplete="off"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col justify-center items-center w-full gap-2 rounded-md ">
            <div className="flex flex-col w-full">
              <input
                data-testid="username-input"
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
          <button data-testid="submit-btn" className="print-paycode-button w-full mt-3">
            Submit
          </button>
        </form>
      </div>
    )
  }
  return (
    <div className="loader-wrapper">
      <LoadingComponent />
    </div>
  )
}

export default SetupPwa
