import React, { type FC } from "react"

interface Props {
  children: React.ReactNode
  shareData: ShareData
  getImage?: () => void
  onSuccess?: () => void
  onError?: (error?: unknown) => void
  onNonNativeShare?: () => void
  onInteraction?: () => void
  disabled?: boolean
}

const ShareController: FC<Props> = ({
  children,
  shareData,
  getImage,
  onInteraction,
  onSuccess,
  onError,
  onNonNativeShare,
  disabled,
}) => {
  const handleOnClick = async () => {
    getImage && getImage()

    onInteraction && onInteraction()
    if (!navigator?.canShare) {
      return onNonNativeShare && onNonNativeShare()
    }

    try {
      await navigator?.share(shareData)
      onSuccess && onSuccess()
    } catch (err) {
      onError && onError(err)
    }
  }

  return (
    <button onClick={handleOnClick} type="button" disabled={disabled}>
      {children}
    </button>
  )
}

export default ShareController
