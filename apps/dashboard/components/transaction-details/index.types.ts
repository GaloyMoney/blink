export interface RowNode {
  __typename: "Transaction";
  id: string;
  createdAt: number;
  settlementDisplayAmount: string;
  settlementDisplayCurrency: string;
  status: string;
  settlementFee: number;
}

export interface TransactionDetailsProps {
  rows: ReadonlyArray<{ node: RowNode }>;
}

export const colorMap: { [key: string]: string } = {
  success: "success",
  danger: "danger",
  neutral: "neutral",
};
