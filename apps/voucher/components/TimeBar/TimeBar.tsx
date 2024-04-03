import React, { useState, useEffect } from "react";

interface Props {
  expirationTimestamp: number;
  setExpired: (expired: boolean) => void;
}

export const TimeBar = ({ expirationTimestamp, setExpired }: Props) => {
  const [timeLeft, setTimeLeft] = useState(expirationTimestamp - Date.now());

  useEffect(() => {
    if (timeLeft <= 0) {
      setExpired(true);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(expirationTimestamp - Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [expirationTimestamp, timeLeft, setExpired]);

  const formatTime = (time: number) => {
    const minutes = Math.floor((time / 1000 / 60) % 60);
    const seconds = Math.floor((time / 1000) % 60);

    return `${minutes}:${seconds}`;
  };

  return <div>{timeLeft > 0 ? formatTime(timeLeft) : "00:00"}</div>;
};
