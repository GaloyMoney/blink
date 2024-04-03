import React from "react"
import InfoIcon from "@mui/icons-material/Info"

import styles from "./InfoComponent.module.css"

interface Props {
  children: React.ReactNode
}

const InfoComponent = ({ children }: Props) => {
  return (
    <div className={styles.bottom_info}>
      <InfoIcon style={{ fontSize: 25, color: "#2f2f2f" }} />
      {children}
    </div>
  )
}

export default InfoComponent
