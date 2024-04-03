"use client";
import React, { useState, useEffect } from "react";
import {
  useGetOnChainPaymentFeesQuery,
  useSendPaymentOnChainMutation,
  useGetWithdrawLinkQuery,
} from "@/utils/generated/graphql";
import LoadingComponent from "@/components/Loading/LoadingComponent";
import Button from "@/components/Button/Button";
import Input from "@/components/Input";
import InfoComponent from "@/components/InfoComponent/InfoComponent";
import LinkDetails from "@/components/LinkDetails/LinkDetails";
import ModalComponent from "@/components/ModalComponent";
import styles from "./OnchainPage.module.css";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FundsPaid from "@/components/FundsPaid";
import PageLoadingComponent from "@/components/Loading/PageLoadingComponent";
import Heading from "@/components/Heading";
import { Status } from "@/utils/generated/graphql";
import { ServerError } from "@apollo/client";

interface Params {
  params: {
    id: string;
  };
}

interface ErrorModal {
  message: string;
  open: boolean;
}

export default function Page({ params: { id } }: Params) {
  const [btcWalletAddress, setBtcWalletAddress] = useState<string>("");
  const [fetchingFees, setFetchingFees] = useState<boolean>(false);
  const [fees, setFees] = useState<number>(0);
  const [confirmModal, setConfirmModal] = useState<boolean>(false);
  const [successModal, setSuccessModal] = useState<boolean>(false);
  const [errorModal, setErrorModal] = useState<ErrorModal>({
    message: "",
    open: false,
  });

  const [
    sendPaymentOnChain,
    { loading: sendPaymentOnChainLoading, error: sendPaymentOnChainError },
  ] = useSendPaymentOnChainMutation();

  const {
    loading: loadingWithdrawLink,
    error: errorWithdrawLink,
    data: dataWithdrawLink,
  } = useGetWithdrawLinkQuery({
    variables: { getWithdrawLinkId: id },
    context: {
      endpoint: "SELF",
    },
  });

  const withdrawLink = dataWithdrawLink?.getWithdrawLink;
  const { loading, data, refetch } = useGetOnChainPaymentFeesQuery({
    variables: { getOnChainPaymentFeesId: id, btcWalletAddress },
    context: {
      endpoint: "SELF",
    },
    skip: !fetchingFees,
    onError: (error) => {
      let errorMessage = error.message;
      if (error.networkError && error.networkError.name === "ServerError") {
        const serverError = error.networkError as ServerError;
        errorMessage = serverError.result?.errors[0]?.message || error.message;
      }
      console.log("error in getting onchain ", { error });
      setErrorModal({
        message: errorMessage,
        open: true,
      });
      setFetchingFees(false);
    },
  });

  const handleConfirm = async () => {
    try {
      const response = await sendPaymentOnChain({
        variables: {
          sendPaymentOnChainId: id,
          btcWalletAddress,
        },
      });

      if (response.data?.sendPaymentOnChain.status === "SUCCESS") {
        setConfirmModal(false);
        setSuccessModal(true);
        window.location.href = `/withdraw/${withdrawLink?.id}`;
      } else if (response.errors) {
        throw new Error(response.errors[0].message);
      }
    } catch (error) {
      setBtcWalletAddress("");
      setConfirmModal(false);
      if (error instanceof Error) {
        setErrorModal({
          message: error.message,
          open: true,
        });
      } else {
        setErrorModal({
          message: "Internal Error please Try later",
          open: true,
        });
      }
    }
  };

  useEffect(() => {
    if (data && data.getOnChainPaymentFees.fees) {
      if (
        Number(withdrawLink?.voucher_amount) -
          data.getOnChainPaymentFees.fees >=
        0
      ) {
        setFees(data.getOnChainPaymentFees.fees);
        setConfirmModal(true);
      } else {
        setErrorModal({
          message: "Fees are greater than funds, try LNURL withdraw",
          open: true,
        });
      }
    }
    setFetchingFees(false);
  }, [data]);

  const handelGetFees = () => {
    if (btcWalletAddress) {
      setFetchingFees(true);
    } else {
      setErrorModal({
        message: "Please enter a valid BTC wallet address",
        open: true,
      });
    }
  };

  if (loadingWithdrawLink) {
    return <PageLoadingComponent />;
  }

  return (
    <div className="top_page_container">
      {withdrawLink?.status === Status.Paid ? (
        <>
          <FundsPaid></FundsPaid>
        </>
      ) : (
        <>
          <Heading>On-chain fund withdrawal</Heading>
          <ModalComponent
            open={successModal}
            onClose={() => setSuccessModal(false)}
          >
            <div className={styles.modal_container_success}>
              <CheckCircleIcon style={{ fontSize: 60, color: "#16ca40" }} />
              <h1 className={styles.modal_heading}>Successfully Paid</h1>

              <Button
                style={{ width: "9em" }}
                onClick={() => setSuccessModal(false)}
              >
                OK
              </Button>
            </div>
          </ModalComponent>

          <ModalComponent
            open={confirmModal}
            onClose={() => {
              setConfirmModal(false);
              setFetchingFees(false);
            }}
          >
            <div className={styles.modal_container}>
              {!sendPaymentOnChainLoading ? (
                <>
                  <h1 className={styles.modal_heading}>Confirm Withdraw</h1>
                  <div>
                    <h2 className={styles.modal_sub_heading}>Fees</h2>
                    <p>
                      {fees}{" "}
                      {withdrawLink?.account_type === "BTC" ? "sats" : "cents"}
                    </p>
                  </div>
                  <div>
                    <h2 className={styles.modal_sub_heading}>
                      Original amount{" "}
                    </h2>
                    <p>
                      {withdrawLink?.voucher_amount}{" "}
                      {withdrawLink?.account_type === "BTC" ? "sats" : "cents"}
                    </p>
                  </div>
                  <div>
                    <h2 className={styles.modal_sub_heading}>
                      Total amount after fees
                    </h2>
                    <p>
                      {Number(withdrawLink?.voucher_amount) - fees}{" "}
                      {withdrawLink?.account_type === "BTC" ? "sats" : "cents"}{" "}
                    </p>
                  </div>
                  <div className={styles.modal_button_container}>
                    <Button
                      onClick={() => {
                        setConfirmModal(false);
                        setFetchingFees(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleConfirm}>Confirm</Button>
                  </div>
                </>
              ) : (
                <>
                  <LoadingComponent />
                </>
              )}
            </div>
          </ModalComponent>

          <ModalComponent
            open={errorModal.open}
            onClose={() =>
              setErrorModal({
                message: "",
                open: false,
              })
            }
          >
            <div className={styles.modal_container}>
              <h1 className={styles.modal_heading}>ERROR</h1>
              <h2 className={styles.modal_description}>{errorModal.message}</h2>
              <div className={styles.modal_button_container}>
                <Button
                  style={{
                    width: "10em",
                  }}
                  onClick={() =>
                    setErrorModal({
                      message: "",
                      open: false,
                    })
                  }
                >
                  OK
                </Button>
              </div>
            </div>
          </ModalComponent>

          <LinkDetails withdrawLink={withdrawLink}></LinkDetails>
          <Input
            label="BTC Wallet Address"
            type="text"
            value={btcWalletAddress}
            style={{
              width: "90%",
            }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setBtcWalletAddress(e.target.value)
            }
          />
          <Button
            style={{
              width: "90%",
            }}
            onClick={handelGetFees}
            disabled={loading}
          >
            {loading ? "Loading..." : "Get Fees"}
          </Button>
          <InfoComponent>
            Please note that on-chain transactions are slower and come with
            transaction fees. If your wallet supports LNURL withdrawal, it is
            recommended to use that option instead.
          </InfoComponent>
        </>
      )}
    </div>
  );
}
