import * as React from "react";
import Table from "@mui/joy/Table";
import Typography from "@mui/joy/Typography";
import { Sheet } from "@mui/joy";
import Chip from "@mui/joy/Chip";
import { TransactionDetailsProps, colorMap } from "./index.types";
import { getStatusColor } from "@/app/helper";

export default function TableComponent({ rows }: TransactionDetailsProps) {
    return (
        <>
            <Sheet
                variant="outlined"
                sx={{
                    display: { xs: "none", sm: "initial" },
                    width: "100%",
                    borderRadius: "sm",
                    flexShrink: 1,
                    overflow: "auto",
                    minHeight: 0,
                }}
            >
                <Table
                    aria-labelledby="tableTitle"
                    stickyHeader
                    hoverRow
                    sx={{
                        "--TableCell-headBackground":
                            "var(--joy-palette-background-level2)",
                        "--Table-headerUnderlineThickness": "1px",
                        "--TableRow-hoverBackground":
                            "var(--joy-palette-background-level1)",
                        "--TableCell-paddingY": "12px",
                        "--TableCell-paddingX": "8px",
                    }}
                >
                    <thead>
                        <tr>
                            <th
                                style={{
                                    width: 240,
                                    padding: "12px 6px",
                                    backgroundColor: "#ffffff",
                                    color: "#757575",
                                }}
                            >
                                Id
                            </th>

                            <th
                                style={{
                                    width: 200,
                                    padding: "12px 6px",
                                    backgroundColor: "#ffffff",
                                    color: "#757575",
                                }}
                            >
                                Transaction Date
                            </th>
                            <th
                                style={{
                                    width: 140,
                                    padding: "12px 6px",
                                    backgroundColor: "#ffffff",
                                    color: "#757575",
                                }}
                            >
                                Settle Amount
                            </th>

                            <th
                                style={{
                                    width: 100,
                                    padding: "12px 6px",
                                    backgroundColor: "#ffffff",
                                    color: "#757575",
                                }}
                            >
                                Status
                            </th>

                            <th
                                style={{
                                    width: 100,
                                    padding: "12px 6px",
                                    backgroundColor: "#ffffff",
                                    color: "#757575",
                                }}
                            >
                                Fees
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr
                                key={index}
                                style={{
                                    borderBottom: "1px solid #ffffff",
                                    backgroundColor: "#ffffff",
                                }}
                            >
                                <td style={{ padding: "12px 6px" }}>
                                    <Typography level="body-md">
                                        {row.node.id}
                                    </Typography>
                                </td>

                                <td style={{ padding: "12px 6px" }}>
                                    <Typography level="body-md">
                                        {new Date(
                                            row.node.createdAt * 1000
                                        ).toLocaleString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                        })}
                                    </Typography>
                                </td>
                                <td style={{ padding: "12px 6px" }}>
                                    <Typography level="body-md">
                                        {row.node.settlementDisplayAmount}{" "}
                                        {row.node.settlementDisplayCurrency}
                                    </Typography>
                                </td>

                                <td style={{ padding: "12px 6px" }}>
                                    <Chip
                                        // @ts-ignore
                                        color={getStatusColor(row.node.status)}
                                    >
                                        {row.node.status.toLowerCase()}
                                    </Chip>
                                </td>
                                <td style={{ padding: "12px 6px" }}>
                                    <Typography level="body-md">
                                        {row.node.settlementFee} stats
                                    </Typography>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Sheet>
        </>
    );
}
