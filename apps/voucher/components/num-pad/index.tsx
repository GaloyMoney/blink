import React from "react"

import BackspaceIcon from "@mui/icons-material/Backspace"

import styles from "./num-pad.module.css"
interface Props {
  currentValue: string
  setCurrentValue: (amount: string) => void
  unit: string
}

const Numpad = ({ currentValue, setCurrentValue, unit }: Props) => {
  const handleAmountChange = (digit: string) => {
    if (digit == "0" && currentValue == "0") {
      return
    }
    if (digit === "." && currentValue.includes(".")) {
      return
    }
    if (currentValue.match(/(\.[0-9]{2,}$|\..*\.)/)) {
      return
    }
    if (currentValue.length > 14) {
      return
    }
    setCurrentValue(currentValue + digit)
  }

  const handlePercentageChange = (digit: string) => {
    const newPercentage = currentValue + digit
    if (newPercentage === "99.") {
      return
    }
    if (digit === "0" && currentValue === "0") {
      return
    }
    if (digit === "." && currentValue.includes(".")) {
      return
    }
    if (currentValue.match(/(\.[0-9]{2,}$|\..*\.)/)) {
      return
    }
    if (parseFloat(newPercentage) > 99) {
      return
    }
    if (newPercentage.length > 6) {
      return
    }
    localStorage.setItem("commission", currentValue + digit)
    setCurrentValue(currentValue + digit)
  }

  const handleChange = (digit: string) => {
    if (unit === "PERCENTAGE") {
      handlePercentageChange(digit)
    } else {
      handleAmountChange(digit)
    }
  }

  const handleBackspace = () => {
    setCurrentValue(currentValue.slice(0, -1))
  }

  return (
    <div className={styles.numpad}>
      <div className={styles.grid}>
        <button
          className={styles.button}
          data-testid="numpad-btn-1"
          onClick={() => handleChange("1")}
        >
          1
        </button>
        <button
          className={styles.button}
          data-testid="numpad-btn-2"
          onClick={() => handleChange("2")}
        >
          2
        </button>
        <button
          className={styles.button}
          data-testid="numpad-btn-3"
          onClick={() => handleChange("3")}
        >
          3
        </button>
        <button
          className={styles.button}
          data-testid="numpad-btn-4"
          onClick={() => handleChange("4")}
        >
          4
        </button>
        <button
          className={styles.button}
          data-testid="numpad-btn-5"
          onClick={() => handleChange("5")}
        >
          5
        </button>
        <button
          className={styles.button}
          data-testid="numpad-btn-6"
          onClick={() => handleChange("6")}
        >
          6
        </button>
        <button
          className={styles.button}
          data-testid="numpad-btn-7"
          onClick={() => handleChange("7")}
        >
          7
        </button>
        <button
          className={styles.button}
          data-testid="numpad-btn-8"
          onClick={() => handleChange("8")}
        >
          8
        </button>
        <button
          className={styles.button}
          data-testid="numpad-btn-9"
          onClick={() => handleChange("9")}
        >
          9
        </button>
        <button
          className={styles.button}
          disabled={unit === "SATS" ? true : false}
          data-testid=""
          onClick={() => handleChange(".")}
        >
          .
        </button>
        <button
          className={styles.button}
          data-testid="numpad-btn-0"
          onClick={() => handleChange("0")}
        >
          0
        </button>
        <button className={styles.button} onClick={handleBackspace}>
          <BackspaceIcon />
        </button>
      </div>
    </div>
  )
}

export default Numpad
