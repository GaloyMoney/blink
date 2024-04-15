"use client"

import React, { useState, useEffect } from "react"
import { gql } from "@apollo/client"

import { useSession } from "next-auth/react"

import { useGetPaginatedTransactionsQuery, Transaction } from "@/lib/graphql/generated"
import LoadingComponent from "@/components/loading"
import { formatCreateAt, formatDate, formatTime } from "@/utils/date-util"
import { sendDataToPosCompanion } from "@/app/print-companion-service"

gql`
  query GetPaginatedTransactions($first: Int, $after: String, $before: String) {
    me {
      id
      defaultAccount {
        transactions(first: $first, after: $after, before: $before) {
          edges {
            cursor
            node {
              createdAt
              direction
              id
              memo
              settlementAmount
              settlementCurrency
              settlementDisplayAmount
              settlementDisplayCurrency
              settlementDisplayFee
              settlementFee
              settlementVia {
                ... on SettlementViaIntraLedger {
                  counterPartyUsername
                  counterPartyWalletId
                }
                ... on SettlementViaLn {
                  paymentSecret
                  preImage
                }
                ... on SettlementViaOnChain {
                  transactionHash
                  vout
                }
              }
              status
              settlementPrice {
                base
                currencyUnit
                formattedAmount
                offset
              }
              initiationVia {
                ... on InitiationViaIntraLedger {
                  counterPartyUsername
                  counterPartyWalletId
                }
                ... on InitiationViaOnChain {
                  address
                }
                ... on InitiationViaLn {
                  paymentHash
                }
              }
            }
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }
    }
  }
`

function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [posCompanionInstalled, setPosCompanionInstalled] = useState<boolean>(false)
  const session = useSession()

  const { data, loading, error, fetchMore } = useGetPaginatedTransactionsQuery({
    variables: { first: 10 },
  })

  useEffect(() => {
    const checkRelatedApps = async () => {
      try {
        if ("getInstalledRelatedApps" in navigator) {
          /* eslint @typescript-eslint/ban-ts-comment: "off" */
          // @ts-ignore-next-line no-implicit-any error
          const apps = await navigator.getInstalledRelatedApps()
          const isAppInstalled = apps.some(
            (app: { id: string }) => app.id === "com.blink.pos.companion",
          )
          setPosCompanionInstalled(isAppInstalled)
        } else {
          console.error("getInstalledRelatedApps is not supported in this browser.")
        }
      } catch (error) {
        console.error("Error checking installed related apps:", error)
      }
    }

    checkRelatedApps()
  }, [])

  useEffect(() => {
    if (data?.me?.defaultAccount?.transactions?.edges) {
      const fetchedTransactions = data.me.defaultAccount.transactions.edges.map(
        (edge) => edge.node,
      ) as Transaction[]

      if (fetchedTransactions) {
        setTransactions(fetchedTransactions)
      }

      if (data?.me?.defaultAccount?.transactions?.pageInfo?.endCursor) {
        setCursor(data.me.defaultAccount.transactions.pageInfo.endCursor)
      }

      if (data.me.defaultAccount.transactions.pageInfo.hasNextPage) {
        setHasMore(data.me.defaultAccount.transactions.pageInfo.hasNextPage)
      } else {
        setHasMore(false)
      }
    }
  }, [data])

  const loadMoreTransactions = () => {
    if (!hasMore) return

    fetchMore({
      variables: {
        first: 10,
        after: cursor,
      },
    }).then((fetchedData) => {
      if (!fetchedData?.data?.me?.defaultAccount?.transactions?.edges) return

      const newTransactions = fetchedData.data.me.defaultAccount.transactions.edges.map(
        (edge) => edge.node,
      ) as Transaction[]

      setTransactions((prev) => [...prev, ...newTransactions])
      if (fetchedData.data.me.defaultAccount.transactions.pageInfo.endCursor) {
        setCursor(fetchedData.data.me.defaultAccount.transactions.pageInfo.endCursor)
      }
      setHasMore(fetchedData.data.me.defaultAccount.transactions.pageInfo.hasNextPage)
    })
  }

  return (
    <div
      style={{
        margin: "1em auto",
        maxWidth: "30em",
        width: "90%",
        display: "flex",
        flexDirection: "column",
        gap: "1em",
      }}
    >
      {loading ? (
        <LoadingComponent />
      ) : error ? (
        <div>Error occurred! {error.message}</div>
      ) : transactions.length === 0 ? (
        <div>No transactions to display</div>
      ) : (
        transactions.map((transaction, index) => (
          <div className="bg-slate-200 p-2 rounded-lg space-y-2" key={index}>
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">Amount</span>
              <span>
                {transaction.settlementDisplayAmount}{" "}
                {transaction.settlementDisplayCurrency}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">Created at</span>
              <span>{formatCreateAt(transaction.createdAt)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">Wallet</span>
              <span>{transaction.settlementCurrency}</span>
            </div>
            <div>
              {posCompanionInstalled && (
                <button
                  className="flex-1 bg-slate-300 p-2 rounded-md text-black w-full"
                  onClick={() => {
                    if (session?.data?.userData?.me?.username)
                      sendDataToPosCompanion({
                        username: session?.data?.userData?.me?.username,
                        amount: `${transaction.settlementDisplayAmount} ${transaction.settlementDisplayCurrency}`,
                        transactionId: transaction.id,
                        date: formatDate(transaction.createdAt),
                        time: formatTime(transaction.createdAt),
                        paymentHash:
                          transaction.initiationVia.__typename === "InitiationViaLn"
                            ? transaction.initiationVia?.paymentHash
                            : undefined,
                      })
                  }}
                >
                  Print Receipt
                </button>
              )}
            </div>
          </div>
        ))
      )}
      {hasMore && (
        <button
          className="bg-orange-500 p-2 rounded-full text-white mt-2 mb-2"
          onClick={loadMoreTransactions}
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  )
}

export default TransactionsPage
