import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/joy/Typography";
import { Sheet } from "@mui/joy";
import Chip from "@mui/joy/Chip";
import { TransactionDetailsProps, colorMap } from "./index.types";
import { getStatusColor } from "@/app/helper";

export default function CardComponent({ rows }: TransactionDetailsProps) {


    return (
        <>
            <Sheet
                variant="outlined"
                sx={{
                    display: { xs: "initial", sm: "none" },
                    width: "100%",
                    borderRadius: "sm",
                    flexShrink: 1,
                    overflow: "auto",
                    minHeight: 0,
                }}
            >
                {rows.map((row, index) => (
                    <Card key={index} sx={{ margin: 2 }}>
                        <CardContent>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "8px",
                                }}
                            >
                                <Typography level="body-sm" fontWeight="bold">
                                    Id
                                </Typography>
                                <Typography level="body-md">
                                    {row.node.id}
                                </Typography>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "8px",
                                }}
                            >
                                <Typography level="body-sm" fontWeight="bold">
                                    Transaction Date
                                </Typography>
                                <Typography level="body-md">
                                    {new Date(
                                        row.node.createdAt * 1000
                                    ).toLocaleString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </Typography>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "8px",
                                }}
                            >
                                <Typography level="body-sm" fontWeight="bold">
                                    Settle Amount
                                </Typography>
                                <Typography level="body-md">
                                    {row.node.settlementDisplayAmount}{" "}
                                    {row.node.settlementDisplayCurrency}
                                </Typography>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "8px",
                                }}
                            >
                                <Typography level="body-sm" fontWeight="bold">
                                    Status
                                </Typography>
                                <Chip
                                    // @ts-ignore
                                    color={getStatusColor(row.node.status)}
                                    sx={{
                                        backgroundColor: getStatusColor(
                                            row.node.status
                                        ),
                                    }}
                                >
                                    {row.node.status.toLowerCase()}
                                </Chip>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "8px",
                                }}
                            >
                                <Typography level="body-sm" fontWeight="bold">
                                    Fees
                                </Typography>
                                <Typography level="body-md">
                                    {row.node.settlementFee} stats
                                </Typography>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </Sheet>
        </>
    );
}
