"use client";
import React, { ButtonHTMLAttributes } from "react";
// ts-ignore because experimental_useFormStatus is not in the types
// @ts-ignore
import { experimental_useFormStatus as useFormStatus } from "react-dom";
import Loader from "../loader";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  disabled = false,
  ...buttonProps
}) => {
  const { pending } = useFormStatus();
  const loadOrDisable = pending || disabled;
  return (
    <button
      disabled={loadOrDisable}
      {...buttonProps}
      className={`flex-1 ${
        !loadOrDisable ? "bg-orange-500" : "bg-orange-600"
      } text-white p-2 rounded-lg text-sm hover:bg-orange-600`}
    >
      {loadOrDisable ? <Loader size="15px" /> : children}
    </button>
  );
};

export default PrimaryButton;
