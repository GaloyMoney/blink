"use client";
import { env } from "@/env";
import React from "react";
import { useGetWithdrawLinkQuery ,Status } from "@/utils/generated/graphql";
import Link from "next/link";
import Button from "@/components/Button/Button";
import LinkDetails from "@/components/LinkDetails/LinkDetails";
import InfoComponent from "@/components/InfoComponent/InfoComponent";
import FundsPaid from "@/components/FundsPaid";
import PageLoadingComponent from "@/components/Loading/PageLoadingComponent";
import Heading from "@/components/Heading";
const { NEXT_PUBLIC_LOCAL_URL } = env;

interface Params {
  params: {
    id: string;
  };
}

// this page shows the LNURLw screen after success in fund transfer to escrow account
export default function Page({ params: { id } }: Params) {
  const { loading, error, data } = useGetWithdrawLinkQuery({
    variables: { getWithdrawLinkId: id },
    context: {
      endpoint: "SELF",
    },
  });

  if (loading) {
    return <PageLoadingComponent />;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (!data) {
    return <div>No data</div>;
  }

  return (
    <div className="top_page_container">
      {data.getWithdrawLink?.status === Status.Paid ? (
        <>
          <FundsPaid/>
        </>
      ) : (
        <>
          <Heading>Please Withdraw your funds</Heading>
          <LinkDetails withdrawLink={data.getWithdrawLink}></LinkDetails>
          <Link
            style={{ width: "90%" }}
            href={`${NEXT_PUBLIC_LOCAL_URL}/withdraw/${id}/lnurl`}
          >
            <Button>
              <span>LNURLw Link</span>{" "}
            </Button>
          </Link>

          <Link
            style={{ width: "90%" }}
            href={`${NEXT_PUBLIC_LOCAL_URL}/withdraw/${id}/onchain`}
          >
            <Button>
              <span>On Chain</span>{" "}
            </Button>
          </Link>

          <InfoComponent>
            You can withdraw funds from supported LNURL wallets or through
            on-chain transactions. However, please note that on-chain
            transactions will incur transaction fees.
          </InfoComponent>
        </>
      )}
    </div>
  );
}
