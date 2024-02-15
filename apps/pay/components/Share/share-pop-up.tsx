import copy from "copy-to-clipboard"
import React, { type FC, useState } from "react"

import styles from "./share.module.css"

type ShareState = "pending" | "success" | "error"

interface Props {
  shareData: ShareData
  image?: string | null
  getImage?: () => void
  shareState: string | undefined
  onClose: () => void
  onError?: (error?: unknown) => void
}

const SharePopup: FC<Props> = ({
  shareData,
  shareState,
  image,
  getImage,
  onClose,
  onError,
}) => {
  const [state, setState] = useState<ShareState>("pending")

  const copyImageToClipboard = async () => {
    try {
      if (image) {
        getImage && getImage()

        const data = await fetch(image)
        const blob = await data.blob()

        await navigator?.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ])

        setState("success")
        setTimeout(() => {
          setState("pending")
          onClose()
        }, 2000)
      }
    } catch (err) {
      onError && onError(err)
      setState("error")
      setTimeout(() => {
        setState("pending")
        onClose()
      }, 3000)
    }
  }

  const copyUrlToClipboard = async () => {
    try {
      copy(shareData?.url || "")
      setState("success")
      setTimeout(() => {
        setState("pending")
        onClose()
      }, 2000)
    } catch (err) {
      onError && onError(err)
      setState("error")
      setTimeout(() => {
        setState("pending")
        onClose()
      }, 3000)
    }
  }

  return (
    <div>
      <div>
        {shareState === "not-set" ? (
          <div className={styles.container}>
            {state === "success" ? (
              <div className={styles.select_share_type}>
                Invoice link copied to clipboard
              </div>
            ) : state === "error" ? (
              <div className={styles.error}>
                <p>Unable to copy to clipboard, please copy the link instead to share.</p>
              </div>
            ) : (
              <div className={styles.select_share_type}>
                <button onClick={onClose} className={styles.close_btn}>
                  <div aria-hidden="true">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <g id="close">
                        <path
                          id="x"
                          d="M18.717 6.697l-1.414-1.414-5.303 5.303-5.303-5.303-1.414 1.414 5.303 5.303-5.303 5.303 1.414 1.414 5.303-5.303 5.303 5.303 1.414-1.414-5.303-5.303z"
                        />
                      </g>
                    </svg>
                  </div>
                </button>
                <button onClick={copyUrlToClipboard}>Link</button>
                <button onClick={copyImageToClipboard}>QR code</button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default SharePopup
