import React, { useState } from "react"
import styles from "./NumPad.module.css"
import BackspaceIcon from "@mui/icons-material/Backspace"
import Button from "../Button/Button"
import RestartAltIcon from "@mui/icons-material/RestartAlt"
interface Props {
  currentAmount: string
  setCurrentAmount: (amount: string) => void
  unit: string
}

const Numpad = ({ currentAmount, setCurrentAmount, unit }: Props) => {
  const handelAmountChange = (digit: string) => {
    if (digit == "0" && currentAmount == "0") {
      return
    }
    if (digit === "." && currentAmount.includes(".")) {
      return
    }
    if (currentAmount.match(/(\.[0-9]{2,}$|\..*\.)/)) {
      return
    }
    if (currentAmount.length > 14) {
      return
    }
    setCurrentAmount(currentAmount + digit)
  }

  const handelPercentageChange = (digit: string) => {
    let newPercentage = currentAmount + digit
    if (newPercentage === "99.") {
      return
    }
    if (digit === "0" && currentAmount === "0") {
      return
    }
    if (digit === "." && currentAmount.includes(".")) {
      return
    }
    if (currentAmount.match(/(\.[0-9]{2,}$|\..*\.)/)) {
      return
    }
    if (parseFloat(newPercentage) > 99) {
      return
    }
    if (newPercentage.length > 6) {
      return
    }
    localStorage.setItem("commission", currentAmount + digit)
    setCurrentAmount(currentAmount + digit)
  }

  const handleChange = (digit: string) => {
    if (unit === "PERCENTAGE") {
      handelPercentageChange(digit)
    } else {
      handelAmountChange(digit)
    }
  }

  const handleBackspace = () => {
    setCurrentAmount(currentAmount.slice(0, -1))
  }

  return (
    <div className={styles.numpad}>
      <div className={styles.grid}>
        <button className={styles.button} onClick={() => handleChange("1")}>
          1
        </button>
        <button className={styles.button} onClick={() => handleChange("2")}>
          2
        </button>
        <button className={styles.button} onClick={() => handleChange("3")}>
          3
        </button>
        <button className={styles.button} onClick={() => handleChange("4")}>
          4
        </button>
        <button className={styles.button} onClick={() => handleChange("5")}>
          5
        </button>
        <button className={styles.button} onClick={() => handleChange("6")}>
          6
        </button>
        <button className={styles.button} onClick={() => handleChange("7")}>
          7
        </button>
        <button className={styles.button} onClick={() => handleChange("8")}>
          8
        </button>
        <button className={styles.button} onClick={() => handleChange("9")}>
          9
        </button>
        <button
          className={styles.button}
          disabled={unit === "SATS" ? true : false}
          onClick={() => handleChange(".")}
        >
          .
        </button>
        <button className={styles.button} onClick={() => handleChange("0")}>
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
