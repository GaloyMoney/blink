import React from "react";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Typography from "@mui/joy/Typography";
import { Box, Chip } from "@mui/joy";

interface PriceContainerProps {
  DefaultAccountId: string;
  AccountDetails: any;
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
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "1em",
          marginTop: "5em",
          flexWrap: "wrap",
        }}
      >
        {AccountDetails.map((walletData) => (
          <Card
            key={walletData.id}
            sx={{
              minWidth: "30em",
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
                  <p>{walletData.walletCurrency}</p>
                  {DefaultAccountId === walletData.accountId ? (
                    <>
                      <Chip variant="outlined">Default Account</Chip>
                    </>
                  ) : null}
                </Typography>
                <Typography level="h2">$ {walletData.balance}</Typography>
                <p>Pending Amount {walletData.pendingIncomingBalance}</p>
              </CardContent>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
