import React, { ReactElement } from "react";
import Modal, { ModalProps } from "@mui/material/Modal";
import Box from "@mui/material/Box";

interface Props extends ModalProps {
  children: any;
}

export default function ModalComponent({ children, ...props }: Props) {
  return (
    <Modal {...props}>
      <Box
        sx={{
          position: "absolute" as "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "white",
          boxShadow: 5,
          borderRadius: "0.5em",
          p: 4,
        }}
      >
        {children}
      </Box>
    </Modal>
  );
}
