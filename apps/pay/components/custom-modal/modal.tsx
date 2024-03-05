import React from "react"
import Image from "react-bootstrap/Image"

import styles from "./modal.module.css"

interface Props {
  children?: React.ReactNode
  modalContentRef?: React.LegacyRef<HTMLDivElement>
  isOpened: boolean
  handleClose: () => void
  modalTitle?: string
  modalWidth?: string
}

const Modal = (
  { children, isOpened, modalTitle, modalWidth, handleClose }: Props,
  modalContentRef: React.ForwardedRef<HTMLDivElement>,
) => {
  const defaultModalWidth = modalWidth || "100%"
  const modalFocus = modalContentRef || null

  return (
    <dialog open={isOpened} className={styles.modal}>
      <div className={styles.modalWrapper} style={{ width: defaultModalWidth }}>
        <button onClick={handleClose} className={styles.closeBtn}>
          <Image src="/icons/cross-icon.svg" alt="Close icon" />
        </button>
        <div ref={modalFocus}>
          <div className={styles.modalTitle}>{modalTitle || ""}</div>
          <div>{children}</div>
        </div>
      </div>
    </dialog>
  )
}

export default React.forwardRef(Modal)
