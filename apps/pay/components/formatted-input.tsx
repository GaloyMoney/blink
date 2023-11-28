import * as React from "react"

const formatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
})

const parseInputValue = (inputValue: string) => {
  // TODO: Consider other currency amount formats here
  const numberValue = Number(inputValue.replace(/[^0-9.]/g, ""))
  const inputValueIncomplete = inputValue.match(/(\.[1-9]?0+|\.)$/)
  const formattedValue =
    // Allaw fixing invalid input and typing the decimal part at the end
    Number.isNaN(numberValue) || inputValueIncomplete
      ? inputValue
      : formatter.format(numberValue)
  return {
    numberValue,
    formattedValue,
  }
}

function FormattedInput({
  value,
  onValueChange,
}: {
  value: string
  onValueChange: ({
    numberValue,
    formattedValue,
  }: {
    numberValue: number
    formattedValue: string
  }) => void
}) {
  const [input, setInput] = React.useState(parseInputValue(value))

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Block more than 2 decmial numbers or points in the input
    if (e.target.value.match(/(\.[0-9]{3,}$|\..*\.)/)) return

    const parsedInputValue = parseInputValue(e.target.value)

    setInput(parsedInputValue)
    onValueChange(parsedInputValue)
  }

  return <input value={input.formattedValue} onChange={handleOnChange} />
}

export default React.memo(FormattedInput)
