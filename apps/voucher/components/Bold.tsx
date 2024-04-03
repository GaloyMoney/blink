import React, { ReactNode } from "react";

interface BoldProps {
  children: ReactNode;
  [x: string]: any;
}

export default function Bold({ children, ...props }: BoldProps) {
  return (
    <span className="font-bold" {...props}>
      {children}
    </span>
  );
}
