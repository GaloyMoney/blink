import React from "react"

import styles from "./Button.module.css"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  enabled?: boolean
}

const Button = (props: ButtonProps) => {
  const { enabled, className, ...otherProps } = props
  const buttonClassName = `${enabled ? styles.EnabledButton : styles.Button} ${className}`
  return <button className={buttonClassName} {...otherProps}></button>
}

export default Button
