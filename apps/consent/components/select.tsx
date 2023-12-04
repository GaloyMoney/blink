import React, { SelectHTMLAttributes } from "react"

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  id: string
  options: string[]
}

const SelectComponent: React.FC<SelectProps> = ({
  label,
  id,
  options,
  ...selectProps
}) => {
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
      <select
        {...selectProps}
        id={id}
        className="p-2 
                  border-1 
                  border-solid 
                  border-gray-300 
                  rounded-md 
                  w-full 
                  bg-[var(--inputBackground)] 
                  focus:border-blue-500 "
      >
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

export default SelectComponent
