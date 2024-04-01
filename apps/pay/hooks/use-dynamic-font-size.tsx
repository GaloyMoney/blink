import { useState, useEffect } from "react"

type Props = {
  inputValue: string | number
  defaultSize: number
}

export default function useDynamicFontSize({ inputValue, defaultSize }: Props) {
  const [fontSize, setFontSize] = useState(`${defaultSize}rem`)

  useEffect(() => {
    const calculateFontSize = () => {
      const screenWidth = window.innerWidth
      const length = inputValue.toString().length
      const baseSize = defaultSize * 16

      const newSize = Math.max(16, Math.min(baseSize, screenWidth / length, 600 / length))
      setFontSize(`${newSize}px`)
    }
    calculateFontSize()
    window.addEventListener("resize", calculateFontSize)
    return () => window.removeEventListener("resize", calculateFontSize)
  }, [inputValue, defaultSize])

  return fontSize
}
