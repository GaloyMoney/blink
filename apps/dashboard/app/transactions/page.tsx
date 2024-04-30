import { getServerSession } from "next-auth"
import React from "react"

import { authOptions } from "../api/auth/[...nextauth]/route"

import TransactionDetails from "@/components/transaction-details/transaction-details-table"
import ContentContainer from "@/components/content-container"
import {
  fetchFirstTransactions,
  fetchPaginatedTransactions,
} from "@/services/graphql/queries/get-transactions"
import TransactionCard from "@/components/transaction-details/transaction-card-item"
import PageNumber from "@/components/transaction-details/page-number"
import ExportCsv from "@/components/transaction-details/export-csv"

interface TransactionDetailsSearchParams {
  cursor: string
  direction: "next" | "previous"
}

export default async function page({
  searchParams,
}: {
  searchParams: TransactionDetailsSearchParams
}) {
  const { cursor, direction } = searchParams
  const session = await getServerSession(authOptions)
  const token = session?.accessToken
  if (!token || typeof token !== "string") {
    throw new Error("invalid token")
  }

  const numberOfTransactions = 50
  let response
  if (cursor && direction) {
    response = await fetchPaginatedTransactions({
      token,
      direction,
      cursor,
      first: numberOfTransactions,
    })
  } else {
    response = await fetchFirstTransactions({ token, first: numberOfTransactions })
  }

  const rows = response?.edges?.map((edge) => ({ node: edge.node })) ?? []
  const pageInfo = response?.pageInfo
  return (
    <ContentContainer>
      {rows.length > 0 ? (
        <>
          <ExportCsv rows={rows} />
          <TransactionDetails rows={rows} />
          <TransactionCard rows={rows} />
          <PageNumber pageInfo={pageInfo}></PageNumber>
        </>
      ) : (
        <span>No Transactions Found</span>
      )}
    </ContentContainer>
  )
}
