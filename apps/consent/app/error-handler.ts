import axios from "axios";

interface ErrorResponse {
  error: boolean;
  message: string;
  responsePayload: null;
}

const errorMessages: { [key: string]: string } = {
  UserCodeAttemptIpRateLimiterExceededError: "Your rate limit exceeded",
};

export const handleAxiosError = (err: any): ErrorResponse => {
  if (axios.isAxiosError(err) && err.response) {
    const errorCode = err.response?.data?.error?.name;
    const errorMessage =
      errorCode && errorMessages.hasOwnProperty(errorCode)
        ? errorMessages[errorCode as keyof typeof errorMessages]
        : errorCode || err?.response?.data?.error;
    console.error("Error:", errorMessage);
    return {
      error: true,
      message: errorMessage,
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
