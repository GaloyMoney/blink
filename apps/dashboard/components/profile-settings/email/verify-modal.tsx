"use client";
// Import statements
import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  Input,
  Modal,
  Sheet,
  Typography,
} from "@mui/joy";
import {
  emailRegisterInitiateServerAction,
  emailRegisterValidateServerAction,
} from "./../server-actions";
// @ts-ignore
import { experimental_useFormState as useFormState } from "react-dom";
// @ts-ignore
import { experimental_useFormStatus as useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { revalidatePath } from "next/cache";

type emailDataProps = {
  readonly address?: string | null | undefined;
  readonly verified?: boolean | null | undefined;
  modalOpen: boolean;
  setModalOpen: (modalOpen: boolean) => void;
};

function EnableEmailModal({
  address,
  verified,
  modalOpen,
  setModalOpen,
}: emailDataProps) {
  const { pending } = useFormStatus();
  const router = useRouter();
  const [initiateState, initiateFormAction] = useFormState(
    emailRegisterInitiateServerAction,
    null
  );
  const [validateState, validateFormAction] = useFormState(
    emailRegisterValidateServerAction,
    null
  );

  const handleClose = (event: React.SyntheticEvent, reason: string) => {
    if (reason === "backdropClick") {
      event.stopPropagation();
      return;
    }
    revalidatePath("/profile", "page");
  };

  return initiateState?.message === "success" ? (
    <form
      action={validateFormAction}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1em",
      }}
    >
      {pending ? (
        <CircularProgress variant="plain" />
      ) : (
        <>
          <Typography level="h4" textAlign="center">
            Validation Code
          </Typography>
          <Input name="code" type="text" required placeholder="Code" />
          <input
            name="emailRegistrationId"
            type="hidden"
            value={
              initiateState.data.userEmailRegistrationInitiate
                .emailRegistrationId
            }
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={() => setModalOpen(false)} sx={{ flex: 1 }}>
              Cancel
            </Button>
            <Button type="submit" sx={{ flex: 1 }}>
              Submit
            </Button>
          </Box>
        </>
      )}
    </form>
  ) : address ? (
    <Modal
      open={modalOpen}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      disableEnforceFocus={true}
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <Sheet
        variant="outlined"
        sx={{
          borderRadius: "md",
          p: 3,
          display: "flex",
          flexDirection: "column",
          width: "50%",
        }}
      >
        <form
          action={initiateFormAction}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1em",
          }}
        >
          {pending ? (
            <CircularProgress variant="plain" />
          ) : (
            <>
              <Typography level="h4" textAlign="center">
                Email Confirmation
              </Typography>
              A code will be sent to your email {address}
              <input name="email" type="hidden" value={address} />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button onClick={() => setModalOpen(false)} sx={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button type="submit" sx={{ flex: 1 }}>
                  Ok
                </Button>
              </Box>
            </>
          )}
        </form>
      </Sheet>
    </Modal>
  ) : null;
}

export default EnableEmailModal;
