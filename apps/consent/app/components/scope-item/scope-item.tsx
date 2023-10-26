import React from "react"

import styles from "./scope-item.module.css"

interface ScopeItemProps {
  scope: string
}

const ScopeItem: React.FC<ScopeItemProps> = ({ scope }) => (
  <label className={styles.item_container} htmlFor={scope}>
    <span className={styles.custom_label}>{scope}</span>
    <input
      type="checkbox"
      id={scope}
      value={scope}
      name="grant_scope"
      className={styles.grant_scope}
    />
  </label>
)

export default ScopeItem
