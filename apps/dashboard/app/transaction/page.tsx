import { getServerSession } from "next-auth";
import React from "react";
import { authOptions } from "../api/auth/[...nextauth]/route";
import TransactionDetails from "@/components/transaction-details/transaction-details";
import ContentContainer from "@/components/content-container";
import {
    fetchFirstTransactions,
    fetchPaginatedTransactions,
} from "@/services/graphql/queries/get-transactions";
import { redirect } from "next/navigation";
import TransactionCard from "@/components/transaction-details/transaction-item";
import PageNumber from "@/components/transaction-details/page-number";

interface TransactionDetailsSearchParams {
    cursor: string;
    direction: "next" | "previous";
}

export default async function page({
    searchParams,
}: {
    searchParams: TransactionDetailsSearchParams;
}) {
    const { cursor, direction } = searchParams;
    const session = await getServerSession(authOptions);
    const isAuthed = session?.sub ?? false;
    const token = session?.accessToken;
    if (!isAuthed) {
        redirect("/sign-in");
    }

    let response;

    if (cursor && direction) {
        response = await fetchPaginatedTransactions(
            token,
            direction,
            cursor,
            10
        );
    } else {
        response = await fetchFirstTransactions(token, 10);
    }

    const rows = response?.edges?.map((edge) => ({ node: edge.node })) ?? [];

    const pageInfo = response?.pageInfo;

    return (
        <ContentContainer>
            {rows.length > 0 ? (
                <>
                    <TransactionDetails rows={rows} />
                    <TransactionCard rows={rows} />
                    <PageNumber pageInfo={pageInfo}></PageNumber>
                </>
            ) : (
                <span>No Transactions Found</span>
            )}
        </ContentContainer>
    );
}
