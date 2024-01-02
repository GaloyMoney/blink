"use client"
import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Box, Button, Card, Modal, ModalClose, Sheet, Typography } from "@mui/joy"

import FileUpload from "../upload-button"
import DetailsCard from "../details-card"
import Details from "../details-card/derails"

import BatchPaymentsList from "./list"

import { validateCSV } from "@/app/batch-payments/utils"

import {
  ProcessedRecords,
  processPaymentsServerAction,
  processRecords,
} from "@/app/batch-payments/server-actions"
import { getCurrencyFromWalletType } from "@/app/utils"
import { WalletCurrency } from "@/services/graphql/generated"

type paymentDetails = {
  totalAmount: number
  walletType: WalletCurrency
  walletDetails?: {
    balance: number
    walletCurrency: string
    id: string
  }
}

type ModalDetails = {
  open: boolean
  heading: string
  message: string
}

export default function BatchPayments() {
  const session = useSession()
  console.log(session)
  const userData = session?.data?.userData?.data.me
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<ProcessedRecords[]>([])
  const [processCsvLoading, setProcessCsvLoading] = useState<boolean>(false)
  const [processPaymentLoading, setProcessPaymentLoading] = useState<boolean>(false)
  const [paymentDetails, setPaymentDetails] = useState<paymentDetails | null>(null)
  const [modalDetails, setModalDetails] = useState<ModalDetails>({
    open: false,
    heading: "",
    message: "",
  })

  const resetState = () => {
    setFile(null)
    setCsvData([])
    setProcessCsvLoading(false)
    setProcessPaymentLoading(false)
    setPaymentDetails(null)
  }

  useEffect(() => {
    const processFile = async () => {
      if (!file) return
      const reader = new FileReader()
      reader.onload = async (event) => {
        if (!event.target?.result) {
          return
        }

        const content = event.target.result as string
        const validationResult = validateCSV(content)
        if (validationResult instanceof Error) {
          setModalDetails({
            open: true,
            heading: "Error",
            message: validationResult.message,
          })
          setFile(null)
          return
        }

        const walletDetails = userData?.defaultAccount.wallets.find((wallet) => {
          return wallet.walletCurrency === validationResult.walletType
        })

        if (
          !walletDetails?.balance ||
          walletDetails?.balance < validationResult.totalAmount
        ) {
          setModalDetails({
            open: true,
            heading: "Error",
            message: "Insufficient Balance to complete this batch payment",
          })
          setFile(null)
          return
        }

        const processedRecords = await processRecords(
          validationResult.records,
          validationResult.walletType,
        )

        if (processedRecords.error || !processedRecords.responsePayload) {
          setModalDetails({
            open: true,
            heading: "Error",
            message: processedRecords.message,
          })
          setFile(null)
          return
        }

        setCsvData(processedRecords.responsePayload)
        setPaymentDetails({
          totalAmount: validationResult.totalAmount,
          walletType: validationResult.walletType,
          walletDetails,
        })
      }

      reader.readAsText(file)
    }

    setProcessCsvLoading(true)
    processFile()
    setProcessCsvLoading(false)
  }, [file])

  const processPayments = async () => {
    if (!csvData || !paymentDetails?.walletDetails) return

    setProcessPaymentLoading(true)
    const response = await processPaymentsServerAction(
      csvData,
      paymentDetails?.walletDetails,
    )
    if (
      response.error &&
      response?.responsePayload &&
      response.responsePayload.length > 0
    ) {
      setCsvData(response.responsePayload)
      setModalDetails({
        open: true,
        heading: "Payment Failed",
        message: response.message,
      })
    } else {
      setModalDetails({
        open: true,
        heading: "Payment Success",
        message: "Batch Payment Completed",
      })
      resetState()
    }

    setProcessPaymentLoading(false)
  }

  return (
    <div>
      <Modal
        open={modalDetails.open}
        onClose={() =>
          setModalDetails({
            open: false,
            heading: "",
            message: "",
          })
        }
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <Sheet
          variant="outlined"
          sx={{
            maxWidth: 400,
            borderRadius: "md",
            p: 3,
            boxShadow: "lg",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "left",
            width: "100%",
          }}
        >
          <ModalClose variant="plain" />
          <Typography
            component="h2"
            id="modal-callback"
            level="h4"
            textColor="inherit"
            fontWeight="lg"
            mb={1}
          >
            {modalDetails.heading}
          </Typography>
          <p>{modalDetails.message}</p>
        </Sheet>
      </Modal>

      {csvData.length > 0 && paymentDetails && paymentDetails.walletDetails ? (
        <>
          <Box
            sx={{
              marginBottom: "1em",
              display: "flex",
              flexDirection: "row",
              width: "100%",
              gap: "1em",
            }}
          >
            <DetailsCard>
              <Details
                label="Total Amount"
                value={`${String(paymentDetails.totalAmount)} ${getCurrencyFromWalletType(
                  paymentDetails.walletType,
                )}`}
              />
              <Details label="Wallet Type" value={paymentDetails.walletType} />
              <Details label="Wallet Id" value={paymentDetails.walletDetails.id} />
              <Details
                label="Wallet Balance"
                value={`${
                  paymentDetails.walletDetails.balance
                } ${getCurrencyFromWalletType(paymentDetails.walletType)}`}
              />
              <Button onClick={processPayments} loading={processPaymentLoading}>
                Confirm Payment
              </Button>
            </DetailsCard>
            <FileUpload
              processCsvLoading={processCsvLoading}
              file={file}
              setFile={setFile}
            />
          </Box>
          <BatchPaymentsList
            processedList={csvData}
            walletType={paymentDetails.walletType}
          ></BatchPaymentsList>
        </>
      ) : (
        <>
          <FileUpload
            processCsvLoading={processCsvLoading}
            file={file}
            setFile={setFile}
          />
          <Card
            sx={{
              margin: "1em auto",
              padding: "1em",
            }}
          >
            {`Please upload a CSV file containing the following columns: "username" (the
            recipient of the bitcoin), "cents/sats" (this column will indicate the amount;
            the header of this column will determine which wallet to use. If the header is
            "cents," your USD wallet will be utilized, and the amount will be in cents. If
            "sats" is used, your BTC wallet will be employed, and the amount will be in
            sats), and "memo" (optional)`}
            .
          </Card>
        </>
      )}
    </div>
  )
}
