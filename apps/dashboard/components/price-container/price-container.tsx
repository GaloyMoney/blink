import React from "react";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Typography from "@mui/joy/Typography";
import { Box } from "@mui/joy";

interface WalletData {
    id: string;
    walletCurrency: string;
    balance: number;
    pendingIncomingBalance: number;
}

interface PriceContainerProps {
    DefaultAccountId: string;
    AccountDetails: WalletData[];
}

export default function PriceContainer({
    DefaultAccountId,
    AccountDetails,
}: PriceContainerProps) {
    console.log(DefaultAccountId);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "1em",
                    flexWrap: "wrap",
                }}
            >
                {AccountDetails.map((walletData) => (
                    <Card
                        key={walletData.id}
                        sx={{
                            minWidth: { xs: "100%", md: "48%" },
                            boxShadow: "md",
                            backgroundColor: "white",
                            border: "0.124em solid orange",
                        }}
                    >
                        <CardContent orientation="horizontal">
                            <CardContent>
                                <Typography
                                    level="body-md"
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography>
                                        {walletData.walletCurrency}
                                    </Typography>
                                </Typography>
                                <Typography level="h1">
                                    $ {walletData.balance}
                                </Typography>
                                <Typography level="body-sm">
                                    Pending Amount{" "}
                                    {walletData.pendingIncomingBalance}
                                </Typography>
                            </CardContent>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Box>
    );
}
