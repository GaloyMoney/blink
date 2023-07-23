import React, { InputHTMLAttributes } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  id: string
}

const InputComponent: React.FC<InputProps> = ({ label, id, ...inputProps }) => {
  return (
    <div className="mb-4">
      {label ? (
        <label htmlFor={id} className="block mb-2 text-sm font-medium text-gray-900">
          {label}
        </label>
      ) : null}
      <input {...inputProps} id={id} className="p-2 border rounded w-full" />
    </div>
  )
}

export default InputComponent
