import React, { InputHTMLAttributes } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  id: string
}

const InputComponent: React.FC<InputProps> = ({ label, id, ...inputProps }) => {
  return (
    <div className="mb-4">
      {label ? (
        <label htmlFor={id} className="block mb-2 text-sm font-medium">
          {label}
        </label>
      ) : null}
      <input
        {...inputProps}
        id={id}
        className="p-2 
                  border-1 
                  border-solid 
                  border-gray-300 
                  rounded-md 
                  w-full 
                  bg-gray-200
                  focus:outline-none 
                  focus:border-blue-500 
                  focus:bg-gray-300"
      />
    </div>
  )
}

export default InputComponent
