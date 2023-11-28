import { useRouter } from "next/router"
import React from "react"

import CurrencyDropdown from "../../components/Currency/currency-dropdown"

const SetupPwa = () => {
  const router = useRouter()
  const [username, setUsername] = React.useState<string>("")
  const username_from_local = localStorage.getItem("username")
  const display_currency_from_local = localStorage.getItem("display")
  const [selectedDisplayCurrency, setSelectedDisplayCurrency] = React.useState("USD")

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!username_from_local) {
      localStorage.setItem("username", username)
    }

    if (!display_currency_from_local) {
      localStorage.setItem("display", selectedDisplayCurrency)
    }

    router.push(
      {
        pathname: `${username}`,
        query: { display: selectedDisplayCurrency },
      },
      undefined,
      { shallow: true },
    )
  }

  React.useEffect(() => {
    if (username_from_local) {
      router.push(
        {
          pathname: `${username_from_local}`,
          query: { display: display_currency_from_local },
        },
        undefined,
        { shallow: true },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username_from_local])

  if (!username_from_local) {
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
