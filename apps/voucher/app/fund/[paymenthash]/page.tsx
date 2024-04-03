"use client"
import React, { useEffect, useState } from "react"
import { QRCode } from "react-qrcode-logo"

import CheckCircleIcon from "@mui/icons-material/CheckCircle"

import Link from "next/link"

import { useRouter } from "next/navigation"

import styles from "./fundPage.module.css"

import Button from "@/components/Button/Button"
import {
  Status,
  useGetWithdrawLinkQuery,
  useUpdateWithdrawLinkMutation,
  useLnInvoicePaymentStatusSubscription,
  useDeleteWithdrawLinkMutation,
  InvoicePaymentStatus,
} from "@/lib/graphql/generated"
import LinkDetails from "@/components/LinkDetails/LinkDetails"
import ModalComponent from "@/components/ModalComponent"

import InfoComponent from "@/components/InfoComponent/InfoComponent"
import PageLoadingComponent from "@/components/Loading/PageLoadingComponent"

import Heading from "@/components/Heading"
import Bold from "@/components/Bold"
interface Params {
  params: {
    paymenthash: string
  }
}
declare global {
  interface Window {
    webln: any
  }
}

//this Screen is used to take funds from user for withdraw links
export default function FundPaymentHash({ params: { paymenthash } }: Params) {
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [expired, setExpired] = useState<boolean>(false)
  const isClient = typeof window !== "undefined"
  const isWindows = isClient && navigator.platform.includes("Win")
  const router = useRouter()
  const {
    loading: loadingWithdrawLink,
    error: errorWithdrawLink,
    data: dataWithdrawLink,
  } = useGetWithdrawLinkQuery({
    variables: { getWithdrawLinkId: paymenthash },
    context: {
      endpoint: "SELF",
    },
  })

  const withdrawLink = dataWithdrawLink?.getWithdrawLink
  const paymentRequest = withdrawLink?.paymentRequest

  const [updateWithdrawLink, { loading: updatingWithdrawLink }] =
    useUpdateWithdrawLinkMutation()

  const {
    data: paymentStatusData,
    loading: paymentStatusLoading,
    error: paymentStatusDataError,
  } = useLnInvoicePaymentStatusSubscription({
    variables: {
      paymentRequest: paymentRequest!,
    },
    skip: withdrawLink?.status === Status.Paid,
  })

  const [deleteWithdrawLink, { loading: deletingWithdrawLink }] =
    useDeleteWithdrawLinkMutation()

  useEffect(() => {
    if (
      expired &&
      withdrawLink?.status === Status.Unfunded &&
      paymentStatusData?.lnInvoicePaymentStatus.status !== InvoicePaymentStatus.Paid
    ) {
      try {
        const deleteLink = async () => {
          const result = await deleteWithdrawLink({
            variables: {
              id: withdrawLink?.id,
            },
          })
          router.push("/create")
        }
        deleteLink()
      } catch (err) {
        console.log("error in deleting link", err)
      }
    }
  }, [expired])

  useEffect(() => {
    const handlePaymentStatus = async () => {
      if (
        paymentStatusData &&
        withdrawLink &&
        paymentStatusData.lnInvoicePaymentStatus.status === InvoicePaymentStatus.Paid
      ) {
        try {
          await updateWithdrawLink({
            variables: {
              updateWithdrawLinkId: withdrawLink?.id,
              updateWithdrawLinkInput: { status: Status.Funded },
            },
          })
          setModalOpen(true)
        } catch (error) {
          alert(error)
        }
      }
    }

    handlePaymentStatus()
  }, [paymentStatusData])

  useEffect(() => {
    if (withdrawLink?.paymentRequest) {
      try {
        ;(async () => {
          if (window.webln) {
            const result = await window.webln.enable()
            if (result.enabled) {
              window.webln.sendPayment(withdrawLink.paymentRequest)
            }
          }
        })()
      } catch (error) {
        console.log("error in webln", error)
      }
    }
  }, [withdrawLink?.paymentRequest])

  if (loadingWithdrawLink || updatingWithdrawLink || deletingWithdrawLink) {
    return <PageLoadingComponent />
  }

  if (errorWithdrawLink || paymentStatusDataError) {
    //TODO need to create a error component
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        Error: {errorWithdrawLink?.message} {paymentStatusDataError?.message}
      </div>
    )
  }

  const handleCopyToClipboard = () => {
    if (isClient) {
      navigator.clipboard?.writeText(withdrawLink?.paymentRequest || "")
    }
  }

  return (
    <>
      <div className="top_page_container">
        <ModalComponent open={modalOpen}>
          <div className={styles.modal_container}>
            <CheckCircleIcon style={{ fontSize: 60, color: "#16ca40" }} />
            <h1 className={styles.modal_heading}>Successfully Paid</h1>
            <Link href={`/withdraw/${withdrawLink?.id}/lnurl`}>
              <Button style={{ width: "9em" }} onClick={() => setModalOpen(false)}>
                OK
              </Button>
            </Link>
          </div>
        </ModalComponent>
        <div>
          {withdrawLink?.status === Status.Unfunded ? (
            <Heading>
              Fund Voucher <Bold>{withdrawLink.identifierCode}</Bold> by paying the
              invoice below{" "}
            </Heading>
          ) : (
            <Heading>
              Voucher <Bold>{withdrawLink?.identifierCode}</Bold> is Funded and Link is
              activate
            </Heading>
          )}
        </div>
        <LinkDetails withdrawLink={withdrawLink} setExpired={setExpired}></LinkDetails>
        {withdrawLink?.status === Status.Unfunded ? (
          <div>
            <div className="w-80 h-80 flex flex-col items-center justify-center border border-gray-300 rounded-md p-4">
              <QRCode size={300} value={withdrawLink?.paymentRequest} />
            </div>
            <div className={styles.button_container}>
              <Button
                style={{
                  width: "20em",
                }}
                onClick={handleCopyToClipboard}
              >
                Copy to Clipboard
              </Button>

              <a href={`lightning:${withdrawLink.paymentRequest}`}>
                <Button
                  style={{
                    width: "20em",
                  }}
                >
                  Open in wallet
                </Button>
              </a>
              <Button
                style={{
                  width: "20em",
                  backgroundColor: "#d90429",
                  color: "white",
                }}
                onClick={() => setExpired(true)}
              >
                Cancel Voucher Creation
              </Button>
            </div>
          </div>
        ) : (
          <Link
            style={{
              width: "90%",
            }}
            href={`/withdraw/${withdrawLink?.id}/lnurl`}
          >
            <Button>Next </Button>
          </Link>
        )}

        {withdrawLink?.status === Status.Unfunded ? (
          <InfoComponent>
            Please note that a Stable sats invoice is only valid for 5 minutes, while a
            Regular sats invoice is valid for 24 hours from the point of creation.
          </InfoComponent>
        ) : null}
      </div>
    </>
  )
}
