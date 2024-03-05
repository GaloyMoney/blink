import React from "react"
import { Modal } from "react-bootstrap"

import { useSearchParams } from "next/navigation"

import Image from "next/image"

import { ACTIONS, ACTION_TYPE } from "../../app/reducer"

import styles from "./memo.module.css"

interface Props {
  state: React.ComponentState
  dispatch: React.Dispatch<ACTION_TYPE>
}

const Memo = ({ state, dispatch }: Props) => {
  const searchParams = useSearchParams()
  const amount = searchParams.get("amount") || "0"
  const display = searchParams.get("display") || "USD"
  const memo = searchParams.get("memo") || ""

  const [openModal, setOpenModal] = React.useState<boolean>(false)
  const [currentMemo, setCurrentMemo] = React.useState<string>(memo?.toString() || "")

  const handleSetMemo = () => {
    const params = new URLSearchParams({
      amount,
      memo: currentMemo,
      display,
    })

    const currentUrl = new URL(window.location.toString())
    currentUrl.search = params.toString()
    window.history.pushState({}, "", currentUrl.toString())

    handleClose()
  }

  const handleClose = () => setOpenModal(false)
  const handleShow = () => setOpenModal(true)

  return (
    <div className={styles.container}>
      <div>
        {state.memo ? (
          <div className={styles.noteWrapper}>
            <p>Note:</p>
            <input readOnly value={state.memo} />
          </div>
        ) : null}
        <button
          onClick={handleShow}
          className={`${state.createdInvoice ? styles.disableBtn : styles.addBtn}`}
          disabled={state.createdInvoice}
        >
          {!state.createdInvoice && !state.memo ? "Add note" : null}
          <Image src="/icons/pencil.svg" alt="Add note" width={20} height={20}></Image>
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
          <Modal.Header placeholder="" className={styles.modalHeader} closeButton>
            Add note
          </Modal.Header>
          <Modal.Body>
            <input
              className={styles.modalInput}
              value={memo ? state.memo : currentMemo}
              name="note"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setCurrentMemo(e.target.value)
                dispatch({ type: ACTIONS.ADD_MEMO, payload: e.target.value })
              }}
              type="text"
            />
          </Modal.Body>
          <Modal.Footer className={styles.modalFooter}>
            <button onClick={handleSetMemo}>Set note</button>
            <button onClick={handleClose}>Cancel</button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  )
}

export default Memo
