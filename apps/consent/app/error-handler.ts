import axios from "axios";

interface ErrorResponse {
  error: boolean;
  message: string;
  responsePayload: null;
}

export const handleAxiosError = (err: any): ErrorResponse => {
  if (axios.isAxiosError(err) && err.response) {
    console.error("Error:", err.response.data.error);
    return {
      error: true,
      message: err.response?.data?.error?.name || err?.response?.data?.error,
      responsePayload: null,
    };
  }

  console.error("An unknown error occurred", err);
  return {
    error: true,
    message: "An unknown error occurred",
    responsePayload: null,
  };
};
