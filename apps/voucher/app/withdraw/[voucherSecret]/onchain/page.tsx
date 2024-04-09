"use client"
import React, { useState, useEffect } from "react"

import CheckCircleIcon from "@mui/icons-material/CheckCircle"

import { gql } from "@apollo/client"

import styles from "./on-chain-page.module.css"

import {
  useOnChainWithdrawLinkMutation,
  useGetWithdrawLinkQuery,
  Status,
  OnChainWithdrawResultStatus,
} from "@/lib/graphql/generated"
import LoadingComponent from "@/components/loading/loading-component"
import Button from "@/components/button"
import Input from "@/components/input"
import InfoComponent from "@/components/info-component"
import LinkDetails from "@/components/link-details"
import ModalComponent from "@/components/modal-component"

import FundsPaid from "@/components/funds-paid"
import PageLoadingComponent from "@/components/loading/page-loading-component"
import Heading from "@/components/heading"

interface Params {
  params: {
    voucherSecret: string
  }
}

interface ErrorModal {
  message: string
  open: boolean
}

gql`
  mutation OnChainWithdrawLink($input: OnChainWithdrawLinkInput!) {
    onChainWithdrawLink(input: $input) {
      status
    }
  }
`

export default function Page({ params: { voucherSecret } }: Params) {
  const [btcWalletAddress, setBtcWalletAddress] = useState<string>("")
  const [fetchingFees, setFetchingFees] = useState<boolean>(false)
  const [fees, setFees] = useState<number>(0)
  const [confirmModal, setConfirmModal] = useState<boolean>(false)
  const [successModal, setSuccessModal] = useState<boolean>(false)
  const [errorModal, setErrorModal] = useState<ErrorModal>({
    message: "",
    open: false,
  })

  const {
    loading,
    error,
    data: withdrawLink,
  } = useGetWithdrawLinkQuery({
    variables: { voucherSecret },
    context: {
      endpoint: "SELF",
    },
  })

  const [
    onChainWithdraw,
    { loading: sendPaymentOnChainLoading, error: sendPaymentOnChainError },
  ] = useOnChainWithdrawLinkMutation()

  const handleConfirm = async () => {
    try {
      const response = await onChainWithdraw({
        variables: {
          input: {
            voucherSecret,
            btcWalletAddress,
          },
        },
      })

      if (
        response.data?.onChainWithdrawLink.status === OnChainWithdrawResultStatus.Success
      ) {
        setConfirmModal(false)
        setSuccessModal(true)
        window.location.href = `/withdraw/${voucherSecret}`
      } else if (response.errors) {
        setErrorModal({
          message: response.errors[0].message,
          open: true,
        })
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorModal({
          message: error.message,
          open: true,
        })
      }
    }
  }

  if (loading) {
    return <PageLoadingComponent />
  }

  return (
    <div className="top_page_container">
      {withdrawLink?.getWithdrawLink?.status === Status.Paid ? (
        <>
          <FundsPaid></FundsPaid>
        </>
      ) : (
        <>
          <Heading>On-chain fund withdrawal</Heading>
          <ModalComponent open={successModal} onClose={() => setSuccessModal(false)}>
            <div className={styles.modal_container_success}>
              <CheckCircleIcon style={{ fontSize: 60, color: "#16ca40" }} />
              <h1 className={styles.modal_heading}>Successfully Paid</h1>

              <Button style={{ width: "9em" }} onClick={() => setSuccessModal(false)}>
                OK
              </Button>
            </div>
          </ModalComponent>

          <ModalComponent
            open={confirmModal}
            onClose={() => {
              setConfirmModal(false)
              setFetchingFees(false)
            }}
          >
            <div className={styles.modal_container}>
              {!sendPaymentOnChainLoading ? (
                <>
                  <h1 className={styles.modal_heading}>Confirm Withdraw</h1>
                  <p>
                    Please Note Onchain Withdraw has High fees, Lighting Withdraw is
                    recommended
                  </p>
                  <div className={styles.modal_button_container}>
                    <Button
                      onClick={() => {
                        setConfirmModal(false)
                        setFetchingFees(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleConfirm}>Confirm</Button>
                  </div>
                </>
              ) : (
                <>
                  <LoadingComponent />
                </>
              )}
            </div>
          </ModalComponent>

          <ModalComponent
            open={errorModal.open}
            onClose={() =>
              setErrorModal({
                message: "",
                open: false,
              })
            }
          >
            <div className={styles.modal_container}>
              <h1 className={styles.modal_heading}>ERROR</h1>
              <h2 className={styles.modal_description}>{errorModal.message}</h2>
              <div className={styles.modal_button_container}>
                <Button
                  style={{
                    width: "10em",
                  }}
                  onClick={() =>
                    setErrorModal({
                      message: "",
                      open: false,
                    })
                  }
                >
                  OK
                </Button>
              </div>
            </div>
          </ModalComponent>

          <LinkDetails withdrawLink={withdrawLink?.getWithdrawLink}></LinkDetails>
          <Input
            label="BTC Wallet Address"
            type="text"
            value={btcWalletAddress}
            style={{
              width: "90%",
            }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setBtcWalletAddress(e.target.value)
            }
          />
          <Button
            style={{
              width: "90%",
            }}
            onClick={() => setConfirmModal(true)}
          >
            Withdraw
          </Button>

          <InfoComponent>
            Please note that on-chain transactions are slower and come with transaction
            fees. If your wallet supports LNURL withdrawal, it is recommended to use that
            option instead.
          </InfoComponent>
        </>
      )}
    </div>
  )
}
