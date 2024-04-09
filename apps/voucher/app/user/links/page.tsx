"use client"
import React, { useState, useEffect } from "react"

import Pagination from "@mui/material/Pagination"

import styles from "./user-link-page.module.css"

import PageLoadingComponent from "@/components/loading/page-loading-component"
import UserLinksComponent from "@/components/user-links"

import { getOffset } from "@/utils/helpers"
import { gql } from "@apollo/client"

import {
  Status,
  WithdrawLink,
  useGetWithdrawLinksByUserIdQuery,
} from "@/lib/graphql/generated"

gql`
  query GetWithdrawLinksByUserId($status: Status, $limit: Int, $offset: Int) {
    getWithdrawLinksByUserId(status: $status, limit: $limit, offset: $offset) {
      totalLinks
      withdrawLinks {
        commissionPercentage
        id
        createdAt
        identifierCode
        paidAt
        salesAmountInCents
        status
        userId
        voucherAmountInCents
      }
    }
  }
`

export default function UserLinks() {
  const [status, setStatus] = useState<Status | null>(null)
  const [poll, setPoll] = useState<boolean>(false)
  const [page, setPage] = React.useState(1)

  const { loading, error, data } = useGetWithdrawLinksByUserIdQuery({
    variables: {
      status,
      limit: 10,
      offset: getOffset(page, 10),
    },
    pollInterval: poll ? 10000 : 0,
  })

  useEffect(() => {
    setPoll(true)
    return () => setPoll(false)
  }, [])

  const handleStatusChange = (selectedStatus: Status | "ALL") => {
    if (selectedStatus === "ALL") {
      setStatus(null)
    } else {
      setStatus(selectedStatus)
    }
  }

  const withdrawLinks = data?.getWithdrawLinksByUserId.withdrawLinks
  const totalLinks = data?.getWithdrawLinksByUserId.totalLinks
  const itemsPerPage = 10
  const totalPages = Math.ceil(Number(totalLinks) / itemsPerPage)

  return (
    <div className="top_page_container_user_links">
      <div
        style={{
          width: "95%",
        }}
      >
        <div className="mb-4">
          <select
            className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-white focus:border-white"
            value={status ? status.toString() : ""}
            onChange={(e) => handleStatusChange(e.target.value as Status)}
          >
            <option value="ALL">All</option>
            <option value={Status.Active}>Active</option>
            <option value={Status.Paid}>Paid</option>
          </select>
        </div>
        {loading ? (
          <PageLoadingComponent></PageLoadingComponent>
        ) : error ? (
          <p>Error: {error.message}</p>
        ) : (
          <>
            <div className={styles.LinksContainer}>
              {withdrawLinks?.map((withdrawLink: WithdrawLink) => (
                <UserLinksComponent key={withdrawLink.id} withdrawLink={withdrawLink} />
              ))}
            </div>
            <Pagination
              style={{
                paddingTop: "2em",
                display: "flex",
                justifyContent: "center",
              }}
              count={totalPages}
              page={page}
              variant="outlined"
              shape="rounded"
              onChange={(event, value) => setPage(value)}
            />
          </>
        )}
      </div>
    </div>
  )
}
