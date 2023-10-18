"use client";
import React, { useState } from "react";
import { Button, Typography } from "@mui/joy";
import AddEmailModal from "./add-email-modal";
import VerifyModal from "./verify-modal";

import { Box } from "@mui/joy";

type EmailDataProps = {
  readonly address?: string | null | undefined;
  readonly verified?: boolean | null | undefined;
};

function EnableEmail({ address, verified }: EmailDataProps) {
  const [modalOpen, setModalOpen] = useState(false);
  console.log(address, verified);
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: "1em",
        alignItems: "center",
      }}
    >
      <Typography>Email Address</Typography>
      <>
        {verified ? (
          <>{address}</>
        ) : address ? (
          <>
            <VerifyModal
              modalOpen={modalOpen}
              setModalOpen={setModalOpen}
              address={address}
              verified={verified}
            />
            <Button
              loading={false}
              onClick={() => {
                setModalOpen(true);
              }}
            >
              Verify your email
            </Button>
          </>
        ) : (
          <>
            <AddEmailModal
              modalOpen={modalOpen}
              setModalOpen={setModalOpen}
              address={address}
              verified={verified}
            />
          </>
        )}
      </>
    </Box>
  );
}

export default EnableEmail;
