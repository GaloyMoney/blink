import React from "react"

import { ACTIONS, ACTION_TYPE } from "../../app/_reducer"

interface Props {
  digit: string
  disabled?: boolean
  dispatch: React.Dispatch<ACTION_TYPE>
  displayValue?: string
}

function DigitButton({ digit, disabled, dispatch, displayValue }: Props) {
  const value = displayValue ? displayValue : digit
  return (
    <button
      data-testid={`digit-${value}-btn`}
      className="digit-button"
      disabled={disabled}
      onClick={() => dispatch({ type: ACTIONS.ADD_DIGIT, payload: digit })}
    >
      {value}
    </button>
  )
}

export default DigitButton
