import React, { useState, SelectHTMLAttributes } from "react"

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  id: string
  options: string[]
  placeHolder: string
}

const SelectComponent: React.FC<SelectProps> = ({
  label,
  id,
  options,
  placeHolder,
  ...selectProps
}) => {
  const [value, setValue] = useState("")

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setValue(event.target.value)
    if (selectProps.onChange) {
      selectProps.onChange(event)
    }
  }

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={id}
          className="block mb-2 text-sm font-medium text-[var(--inputColor)]"
        >
          {label}
        </label>
      )}
      <select
        {...selectProps}
        id={id}
        value={value}
        onChange={handleChange}
        className="appearance-none p-2.5 border-1 border-solid border-gray-300 rounded-md w-full bg-[var(--inputBackground)] focus:border-blue-500 text-base text-gray-700"
        style={{
          // using svg for now as this is faster to render
          //TODO will change this later.
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>')`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.5rem center",
          backgroundSize: "1.5em 1.5em",
          color: "var(--inputSecondary)",
        }}
      >
        {placeHolder && (
          <option value="" disabled>
            {placeHolder}
          </option>
        )}
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
