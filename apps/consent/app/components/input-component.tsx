import React, { InputHTMLAttributes } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  id: string
}

const InputComponent: React.FC<InputProps> = ({ label, id, ...inputProps }) => {
  return (
    <div className="mb-4">
      {label ? (
        <label
          htmlFor={id}
          className="block mb-2 text-sm font-medium text-[var(--inputColor)]"
        >
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
                  mb- 
                  w-full 
                  bg-[var(--inputBackground)] 
                  focus-within:border-blue-500 
                  focus-within:bg-[var(--inputBackground)] "
      />
    </div>
  )
}

export default InputComponent
