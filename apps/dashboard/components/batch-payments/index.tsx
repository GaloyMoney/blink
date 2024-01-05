"use client"
import React, { useState } from "react"
import { useSession } from "next-auth/react"
import { Box, Button, Card, Modal, ModalClose, Sheet, Typography } from "@mui/joy"

import FileUpload from "../upload-button"
import DetailsCard from "../details-card"
import Details from "../details-card/derails"

import BatchPaymentsList from "./list"

import SampleCSVTable from "./sample-table"

import { TotalAmountForWallets, validateCSV } from "@/app/batch-payments/utils"

import {
  ProcessedRecords,
  processPaymentsServerAction,
  processRecords,
  validatePaymentDetail,
} from "@/app/batch-payments/server-actions"
import { WalletCurrency } from "@/services/graphql/generated"

import { getDefaultWallet } from "@/app/utils"

type paymentDetails = {
  totalAmount: TotalAmountForWallets
  userWalletBalance: {
    BTC: number
    USD: number
  }
}

type ModalDetails = {
  open: boolean
  heading: string
  message: string
}

export default function BatchPayments() {
  const session = useSession()
  const userData = session?.data?.userData?.data
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

  const processFile = async (file: File) => {
    const reader = new FileReader()
    reader.onload = async (event) => {
      if (!event.target?.result || !userData) {
        return
      }

      const defaultWallet = getDefaultWallet(userData)
      const defaultWalletCurrency = defaultWallet.currency
      const content = event.target.result as string

      if (!defaultWalletCurrency || !defaultWallet.currency) {
        return
      }

      // VALIDATE PAYMENT
      const validateCsvResult = validateCSV({
        fileContent: content,
        defaultWallet: defaultWalletCurrency as WalletCurrency,
      })

      if (validateCsvResult instanceof Error) {
        setModalDetails({
          open: true,
          heading: "Error",
          message: validateCsvResult.message,
        })
        setFile(null)
        return
      }

      // VALIDATE ENOUGH BALANCE AND PAYMENT DETAILS
      const validatePaymentResponse = await validatePaymentDetail(
        validateCsvResult.totalAmount,
      )
      if (validatePaymentResponse.error || !validatePaymentResponse.responsePayload) {
        setModalDetails({
          open: true,
          heading: "Error",
          message: validatePaymentResponse.message,
        })
        setFile(null)
        return
      }

      //PROCESS RECORDS ADD WALLET ID FOR USERNAME
      const processedRecords = await processRecords(validateCsvResult.records)
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
        totalAmount: validateCsvResult.totalAmount,
        userWalletBalance: {
          BTC: validatePaymentResponse.responsePayload?.userWalletBalance
            .btcWalletBalance,
          USD: validatePaymentResponse.responsePayload?.userWalletBalance
            .usdWalletBalance,
        },
      })
    }
    reader.readAsText(file)
  }

  const processPayments = async () => {
    if (!csvData || !paymentDetails) return

    setProcessPaymentLoading(true)
    const response = await processPaymentsServerAction(csvData)
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

      {csvData.length > 0 && paymentDetails && paymentDetails ? (
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
                label="Total Amount for USD Wallet"
                value={`${paymentDetails.totalAmount.wallets.USD} USD`}
              />
              <Details
                label="Total Amount for BTC Wallet for SATS Payments"
                value={`${paymentDetails.totalAmount.wallets.BTC.SATS} SATS`}
              />
              <Details
                label="Total Amount for BTC Wallet for USD Payments"
                value={`${paymentDetails.totalAmount.wallets.BTC.USD} USD`}
              />
              <Details
                label="Total Amount in BTC Wallet"
                value={`${paymentDetails.userWalletBalance.BTC}`}
              />
              <Details
                label="Total Amount in BTC Wallet"
                value={`${paymentDetails.userWalletBalance.USD}`}
              />
              <Button onClick={processPayments} loading={processPaymentLoading}>
                Confirm Payment
              </Button>
            </DetailsCard>
            <FileUpload
              processCsvLoading={processCsvLoading}
              file={file}
              setFile={setFile}
              onFileProcessed={processFile}
              setProcessCsvLoading={setProcessCsvLoading}
            />
          </Box>
          <BatchPaymentsList processedList={csvData}></BatchPaymentsList>
        </>
      ) : (
        <>
          <FileUpload
            setProcessCsvLoading={setProcessCsvLoading}
            processCsvLoading={processCsvLoading}
            file={file}
            setFile={setFile}
            onFileProcessed={processFile}
          />
          <Card
            sx={{
              margin: "1em auto",
              padding: "1em",
            }}
          >
            {`Please upload a CSV file containing the following columns: "username" (the
            recipient of the bitcoin), "dollars/sats" (this column will indicate the amount;
            the header of this column will determine which wallet to use. If the header is
            "dollars," your USD wallet will be utilized, and the amount will be in US dollars. If
            "sats" is used, your BTC wallet will be employed, and the amount will be in
            sats), and "memo" (optional)`}
            .
          </Card>
          <SampleCSVTable />
        </>
      )}
    </div>
  )
}
