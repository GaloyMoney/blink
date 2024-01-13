"use client"
import React, { useState } from "react"
import { useSession } from "next-auth/react"
import { Box, Button, Card, Modal, ModalClose, Sheet, Typography } from "@mui/joy"

import FileUpload from "../upload-button"
import DetailsCard from "../details-card"
import Details from "../details-card/derails"

import BatchPaymentsList from "./list"

import SampleCSVTable from "./sample-table"

import { chunkArray, validateCSV } from "@/app/batch-payments/utils"

import {
  processPaymentsServerAction,
  processRecords,
  validatePaymentDetail,
} from "@/app/batch-payments/server-actions"
import { WalletCurrency } from "@/services/graphql/generated"

import { centsToDollars, getDefaultWallet } from "@/app/utils"
import {
  ProcessedRecords,
  TotalPayingAmountForWallets,
} from "@/app/batch-payments/index.types"

type paymentDetails = {
  totalAmount: TotalPayingAmountForWallets
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

const CHUNK_SIZE = 10

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

  const returnProcessFile = () => {
    setFile(null)
    setProcessCsvLoading(false)
  }

  const processFile = async (file: File) => {
    setProcessCsvLoading(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      if (!event.target?.result || !userData) {
        return
      }

      const defaultWallet = getDefaultWallet(userData)
      const defaultWalletCurrency = defaultWallet.currency
      const content = event.target.result as string

      if (!defaultWalletCurrency || !defaultWallet.currency) {
        return returnProcessFile()
      }

      // Validate CSV format
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
        return returnProcessFile()
      }

      // Validate enough balance, and payment details
      const validatePaymentResponse = await validatePaymentDetail(
        validateCsvResult.totalAmount,
      )
      if (validatePaymentResponse.error || !validatePaymentResponse.responsePayload) {
        setModalDetails({
          open: true,
          heading: "Error",
          message: validatePaymentResponse.message,
        })
        return returnProcessFile()
      }

      //Process Records, add Wallet Id's for username
      const processedRecords = await processRecords(validateCsvResult.records)
      if (processedRecords.error || !processedRecords.responsePayload) {
        setModalDetails({
          open: true,
          heading: "Error",
          message: processedRecords.message,
        })
        return returnProcessFile()
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
      setProcessCsvLoading(false)
    }
    reader.readAsText(file)
  }

  const processPayments = async () => {
    if (!csvData || !paymentDetails) return

    setProcessPaymentLoading(true)
    const chunks = chunkArray(csvData, CHUNK_SIZE)
    let allFailedPayments: ProcessedRecords[] = []
    for (const chunk of chunks) {
      const response = await processPaymentsServerAction(chunk)
      if (
        response.error &&
        response.responsePayload &&
        response.responsePayload.length > 0
      ) {
        allFailedPayments = allFailedPayments.concat(response.responsePayload)
      }
    }

    if (allFailedPayments.length > 0) {
      setCsvData(allFailedPayments)
      setModalDetails({
        open: true,
        heading: "Payment Failed",
        message:
          "Transaction unsuccessful for some orders. Please attempt to retry these failed orders",
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
                label="Total Payable Amount for USD Wallet"
                value={`$${paymentDetails.totalAmount.wallets.usdWallet.USD} USD`}
              />
              <Details
                label="Total Payable Amount by BTC Wallet for SATS Currency"
                value={`${paymentDetails.totalAmount.wallets.btcWallet.SATS} SATS`}
              />
              <Details
                label="Total Payable Amount by BTC Wallet for USD Currency"
                value={`$${paymentDetails.totalAmount.wallets.btcWallet.USD} USD`}
              />
              <Details
                label="Balance in BTC Wallet"
                value={`${paymentDetails.userWalletBalance.BTC} SATS`}
              />
              <Details
                label="Balance in USD Wallet"
                value={`$${centsToDollars(paymentDetails.userWalletBalance.USD)} USD`}
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
              resetState={resetState}
            />
          </Box>
          <BatchPaymentsList processedList={csvData}></BatchPaymentsList>
        </>
      ) : (
        <>
          <FileUpload
            processCsvLoading={processCsvLoading}
            file={file}
            setFile={setFile}
            onFileProcessed={processFile}
            resetState={resetState}
          />
          <Box
            sx={{
              display: "flex",
            }}
          >
            <Card
              sx={{
                margin: "1em auto",
                padding: "1em",
                maxWidth: "60em",
              }}
            >
              <Typography
                level="h3"
                component="div"
                sx={{ fontSize: "h5.fontSize", mb: 2 }}
              >
                Fields for CSV File
              </Typography>

              <ul>
                <li>
                  <Typography component="div" sx={{ mb: 1 }}>
                    <strong>Username:</strong> This column will be used to determine the
                    Blink username of the user to whom the payment has to be sent.
                  </Typography>
                </li>
                <li>
                  <Typography component="div" sx={{ mb: 1 }}>
                    <strong>Amount:</strong> The amount of SATS or USD you want to send.
                    The value of sats will be converted to a whole number if not already.
                  </Typography>
                </li>
                <li>
                  <Typography component="div" sx={{ mb: 1 }}>
                    <strong>Currency:</strong> The currency of the amount can be USD or
                    SATS. SATS currency will only work with BTC wallets.
                  </Typography>
                </li>
                <li>
                  <Typography component="div" sx={{ mb: 1 }}>
                    <strong>Wallet (optional):</strong> The wallet that will be used to
                    send the payment in USD or BTC. If not provided, the default wallet
                    will be used.
                  </Typography>
                </li>
                <li>
                  <Typography component="div" sx={{ mb: 1 }}>
                    <strong>Memo (optional):</strong> The message you want to attach to
                    the payment.
                  </Typography>
                </li>
              </ul>
              <SampleCSVTable />
            </Card>
          </Box>
        </>
      )}
    </div>
  )
}
