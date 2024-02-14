import React from "react"
import { Modal } from "react-bootstrap"

import { useSearchParams, useParams } from "next/navigation"

import { ACTIONS, ACTION_TYPE } from "../../app/reducer"

import styles from "./memo.module.css"

interface Props {
  state: React.ComponentState
  dispatch: React.Dispatch<ACTION_TYPE>
}

const Memo = ({ state, dispatch }: Props) => {
  const searchParams = useSearchParams()
  const { username } = useParams()
  const query = searchParams ? Object.fromEntries(searchParams.entries()) : {}

  const { amount, sats, unit, memo, display } = query
  const [openModal, setOpenModal] = React.useState<boolean>(false)
  const [note, setNote] = React.useState<string>(memo?.toString() || "")

  const handleSetMemo = () => {
    if (unit === "SAT" || unit === "CENT") {
      window.history.pushState(
        {},
        "",
        `${username}?${new URLSearchParams({
          amount: amount,
          sats: sats,
          unit: unit,
          memo: note,
          display,
        }).toString()}`,
      )
    } else {
      window.history.pushState(
        {},
        "",
        `${username}?${new URLSearchParams({ memo: note, display }).toString()}`,
      )
    }
    handleClose()
  }

  const handleClose = () => setOpenModal(false)
  const handleShow = () => setOpenModal(true)

  return (
    <div className={styles.container}>
      <div>
        {state.memo ? (
          <div className={styles.note_wrapper}>
            <p>Note:</p>
            <input readOnly value={state.memo} />
          </div>
        ) : null}
        <button
          onClick={handleShow}
          className={`${state.createdInvoice ? styles.disable_btn : styles.add_btn}`}
          disabled={state.createdInvoice}
        >
          {!state.createdInvoice && !state.memo ? "Add note" : null}
          <svg
            width="19"
            height="19"
            viewBox="0 0 19 19"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_1220_19217)">
              <path
                d="M17.08 2.29526C16.8245 2.04087 16.5212 1.83961 16.1875 1.70313C15.8538 1.56664 15.4963 1.49762 15.1358 1.50006C14.7752 1.5025 14.4188 1.57635 14.0869 1.71735C13.7551 1.85834 13.4545 2.06368 13.2025 2.32151L2.3275 13.1965L1 18.3753L6.17875 17.047L17.0538 6.17201C17.3116 5.92011 17.5171 5.61959 17.6581 5.28782C17.7991 4.95605 17.873 4.59961 17.8755 4.23911C17.8779 3.87861 17.8089 3.52121 17.6723 3.18756C17.5358 2.85391 17.3345 2.55063 17.08 2.29526V2.29526Z"
                stroke={"#232222"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13 2.5L17 6.5"
                stroke={"#232222"}
                strokeWidth="1.125"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 13.5L6 16.5"
                stroke={"#232222"}
                strokeWidth="1.125"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_1220_19217">
                <rect width="19" height="19" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </button>
      </div>
      {openModal && (
        <Modal
          show={openModal}
          onHide={handleClose}
          size="sm"
          aria-labelledby="contained-modal-title-vcenter"
          centered
        >
          <Modal.Header placeholder="" className={styles.modal_header} closeButton>
            Add note
          </Modal.Header>
          <Modal.Body>
            <input
              className={styles.modal_input}
              value={memo ? state.memo : note}
              name="note"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setNote(e.target.value)
                dispatch({ type: ACTIONS.ADD_MEMO, payload: e.target.value })
              }}
              type="text"
            />
          </Modal.Body>
          <Modal.Footer className={styles.modal_footer}>
            <button onClick={handleSetMemo}>Set note</button>
            <button onClick={handleClose}>Cancel</button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  )
}

export default Memo
