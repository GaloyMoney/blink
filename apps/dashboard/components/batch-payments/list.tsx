import React from "react"
import Table from "@mui/joy/Table"

import { ProcessedRecords } from "@/app/batch-payments/server-actions"
import { WalletCurrency } from "@/services/graphql/generated"
import { displayCurrencyBatchPayments } from "@/app/batch-payments/utils"

type BatchPaymentListProps = {
  processedList: ProcessedRecords[]
  walletCurrency: WalletCurrency
}

const BatchPaymentsList: React.FC<BatchPaymentListProps> = ({
  processedList,
  walletCurrency,
}) => {
  const renderTable = (transactions: ProcessedRecords[]) => (
    <>
      {transactions.length > 0 && (
        <>
          <Table aria-label={`payments`}>
            <thead>
              <tr>
                <th>Id</th>
                <th>Username</th>
                <th>Recipient Wallet Id</th>
                <th>Amount</th>
                <th>Memo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((record: ProcessedRecords, index: number) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{record.username}</td>
                  <td>{record.recipient_wallet_id}</td>
                  <td>
                    {record.amount}{" "}
                    {displayCurrencyBatchPayments({
                      walletCurrency,
                    })}
                  </td>
                  <td>{record.memo}</td>
                  <td>
                    {record.status.failed === true
                      ? `Failed: ${record.status.message}`
                      : "Unprocessed"}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </>
  )

  return <>{renderTable(processedList)}</>
}

export default BatchPaymentsList
