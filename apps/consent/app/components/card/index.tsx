import React, { ReactNode } from "react"

import styles from "./card.module.css"

interface CardProps {
  children: ReactNode
}

const Card: React.FC<CardProps> = ({ children }) => {
  return <div className={styles.card}>{children}</div>
}

export default Card
