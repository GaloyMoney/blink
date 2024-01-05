import React from "react"
import Table from "@mui/joy/Table"

import { ProcessedRecords } from "@/app/batch-payments/index.types"

type BatchPaymentListProps = {
  processedList: ProcessedRecords[]
}

const BatchPaymentsList: React.FC<BatchPaymentListProps> = ({ processedList }) => {
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
                <th>Wallet Using</th>
                <th>Memo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((record: ProcessedRecords, index: number) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{record.username}</td>
                  <td>{record.recipientWalletId}</td>
                  <td>
                    {record.amount} {record.currency}
                  </td>
                  <td>{record.sendingWallet}</td>
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
