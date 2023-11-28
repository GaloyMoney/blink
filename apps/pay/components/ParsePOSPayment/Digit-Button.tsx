import React from "react"

import { ACTIONS, ACTION_TYPE } from "../../pages/_reducer"

interface Props {
  digit: string
  disabled?: boolean
  dispatch: React.Dispatch<ACTION_TYPE>
  displayValue?: string
}

function DigitButton({ digit, disabled, dispatch, displayValue }: Props) {
  return (
    <button
      disabled={disabled}
      onClick={() => dispatch({ type: ACTIONS.ADD_DIGIT, payload: digit })}
    >
      {displayValue ? displayValue : digit}
    </button>
  )
}

export default DigitButton
