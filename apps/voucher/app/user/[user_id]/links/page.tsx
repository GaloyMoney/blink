"use client";
import React, { useState, useEffect } from "react";
import {
  Status,
  WithdrawLink,
  useGetWithdrawLinksByUserIdQuery,
} from "@/utils/generated/graphql";

import PageLoadingComponent from "@/components/Loading/PageLoadingComponent";
import UserLinksComponent from "@/components/UserLinks/UserLinks";
import styles from "./UserLinkPage.module.css";
import Pagination from "@mui/material/Pagination";
import { getOffset } from "@/utils/helpers";
interface Params {
  params: {
    user_id: string;
  };
}

export default function UserLinks({ params: { user_id } }: Params) {
  const [status, setStatus] = useState<Status | null>(null); // Initial status is null
  const [poll, setPoll] = useState<boolean>(false);
  const [page, setPage] = React.useState(1);

  const { loading, error, data } = useGetWithdrawLinksByUserIdQuery({
    variables: {
      userId: user_id,
      status,
      limit: 10,
      offset: getOffset(page, 10),
    },
    pollInterval: poll ? 5000 : 0,
  });

  useEffect(() => {
    setPoll(true);
    return () => setPoll(false);
  }, []);

  if (loading) {
  }

  if (error) {
  }
  const handleStatusChange = (selectedStatus: Status | "ALL") => {
    if (selectedStatus === "ALL") {
      setStatus(null);
    } else {
      setStatus(selectedStatus);
    }
  };

  const withdrawLinks = data?.getWithdrawLinksByUserId.withdrawLinks;
  const totalLinks = data?.getWithdrawLinksByUserId.total_links;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(Number(totalLinks) / itemsPerPage);

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
            <option value={Status.Funded}>Funded</option>
            <option value={Status.Paid}>Paid</option>
            <option value={Status.Unfunded}>Unfunded</option>
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
                <UserLinksComponent
                  key={withdrawLink.id}
                  withdrawLink={withdrawLink}
                />
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
  );
}
