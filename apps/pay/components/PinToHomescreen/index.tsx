import React from "react"
import { Image } from "react-bootstrap"

import { getOS } from "../../lib/download"
import { ACTIONS, ACTION_TYPE } from "../../app/reducer"
import Modal from "../CustomModal/modal"

import {
  chromeModalContent,
  desktopIosModalContent,
  iosModalContent,
  mobileChromeModalContent,
} from "./browser-modal-content"
import styles from "./pinToHomescreen.module.css"

interface Props {
  pinnedToHomeScreenModalVisible: boolean
  dispatch: React.Dispatch<ACTION_TYPE>
}

const browser = (function () {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const test = function (regexp) {
    if (typeof window !== "undefined") {
      return regexp.test(window.navigator?.userAgent)
    }
  }
  switch (true) {
    case test(/edg/i):
      return "Microsoft-Edge"
    case test(/trident/i):
      return "Microsoft-Internet-Explorer"
    case test(/firefox|fxios/i):
      return "Mozilla-Firefox"
    case test(/opr\//i):
      return "Opera"
    case test(/ucbrowser/i):
      return "UC-Browser"
    case test(/samsungbrowser/i):
      return "Samsung-Browser"
    case test(/chrome|chromium|crios/i):
      return "Google-Chrome"
    case test(/safari/i):
      return "Apple-Safari"
    default:
      return "Other"
  }
})()

const PinToHomescreen = ({ pinnedToHomeScreenModalVisible, dispatch }: Props) => {
  const os = getOS()

  const pinToHomeRef = React.useRef(null)
  if (!pinnedToHomeScreenModalVisible) return null
  let modalWidth: string

  const handleClose = () => {
    dispatch({
      type: ACTIONS.PINNED_TO_HOMESCREEN_MODAL_VISIBLE,
      payload: false,
    })
  }

  const ua = window.navigator?.userAgent
  const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i)
  const webkit = !!ua.match(/WebKit/i)
  const iOSSafari = iOS && webkit && !ua.match(/CriOS/i)

  if (os === "ios" && !iOSSafari) {
    modalWidth = "340px"
    return (
      <>
        <Modal
          ref={pinToHomeRef}
          isOpened={pinnedToHomeScreenModalVisible}
          handleClose={handleClose}
          modalWidth={modalWidth}
          modalTitle="How to pin the Cash Register to your home screen"
        >
          <div className={`${styles.wrapper} ${styles.desktop}`}>
            This app can not be installed through chrome on iOS. Use a safari browser to
            install/pin the POS app to homescreen.
          </div>
        </Modal>
      </>
    )
  }

  if (os === "ios" && iOSSafari) {
    modalWidth = "340px"
    return (
      <>
        <Modal
          ref={pinToHomeRef}
          isOpened={pinnedToHomeScreenModalVisible}
          handleClose={handleClose}
          modalWidth={modalWidth}
          modalTitle="How to pin the Cash Register to your home screen"
        >
          <div className={styles.wrapper}>
            {iosModalContent.map((content, idx) => {
              return (
                <div key={idx}>
                  <li className={styles.index}>{content.index}</li>
                  <p className={styles.text}>{content.text}</p>
                  <picture>
                    <Image
                      src={content.image}
                      alt="ios modal tutorial"
                      width="100%"
                      height="100%"
                    />
                  </picture>
                </div>
              )
            })}
          </div>
        </Modal>
      </>
    )
  }

  if (os === "android" || browser === "Samsung-Browser") {
    modalWidth = "340px"
    return (
      <>
        <Modal
          ref={pinToHomeRef}
          isOpened={pinnedToHomeScreenModalVisible}
          handleClose={handleClose}
          modalWidth={modalWidth}
          modalTitle="Add to home screen"
        >
          <div className={styles.wrapper}>
            {mobileChromeModalContent.map((content, idx) => {
              return (
                <div key={idx}>
                  <li className={styles.index}>{content.index}</li>
                  <p className={styles.text}>{content.text}</p>
                  <picture>
                    <Image
                      src={content.image}
                      width="100%"
                      height="100%"
                      alt="Chrome modal tutorial image"
                    />
                  </picture>
                </div>
              )
            })}
          </div>
        </Modal>
      </>
    )
  }

  if (browser === "Google-Chrome") {
    modalWidth = "100%"
    return (
      <>
        <Modal
          ref={pinToHomeRef}
          isOpened={pinnedToHomeScreenModalVisible}
          handleClose={handleClose}
          modalWidth={modalWidth}
          modalTitle="How to pin the Cash Register to your home screen"
        >
          <div className={`${styles.wrapper} ${styles.desktop}`}>
            {chromeModalContent.map((content, idx) => {
              return (
                <div key={idx}>
                  <li className={styles.index}>{content.index}</li>
                  <p className={styles.text}>{content.text}</p>
                  <picture>
                    <Image src={content.image} alt="Chrome modal tutorial image" />
                  </picture>
                </div>
              )
            })}
          </div>
        </Modal>
      </>
    )
  }

  if (browser === "Apple-Safari") {
    return (
      <>
        <Modal
          ref={pinToHomeRef}
          isOpened={pinnedToHomeScreenModalVisible}
          handleClose={handleClose}
          modalTitle="How to pin the Cash Register to your home screen"
        >
          <div className={`${styles.wrapper} ${styles.desktop}`}>
            {desktopIosModalContent.map((content, idx) => {
              return (
                <div key={idx}>
                  <li className={styles.index}>{content.index}</li>
                  <p className={styles.text}>{content.text}</p>
                  <picture>
                    <Image src={content.image} alt="chrome modal tutorial image" />
                  </picture>
                </div>
              )
            })}
          </div>
        </Modal>
      </>
    )
  }

  return (
    <>
      <Modal
        ref={pinToHomeRef}
        isOpened={pinnedToHomeScreenModalVisible}
        handleClose={handleClose}
        modalTitle="How to pin the Cash Register to your home screen"
      >
        <div className={`${styles.wrapper} ${styles.desktop}`}>
          Check the menu options of your browser for options to add to homescreen.
        </div>
      </Modal>
    </>
  )
}

export default PinToHomescreen
