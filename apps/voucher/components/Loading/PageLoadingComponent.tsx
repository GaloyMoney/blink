import React from "react";
import styles from "./LoadingComponent.module.css";
export default function LoadingComponent() {
  return (
    <div className={styles.full_page}>
      <span className={styles.loader}></span>
    </div>
  );
}
