import { v4 as uuidv4 } from "uuid";
import { bech32 } from "bech32";

export function generateRandomHash(): string {
  const uuid = uuidv4();
  return uuid.replace(/-/g, "");
}

export function encodeURLToLNURL(url: string): string {
  let words = bech32.toWords(Buffer.from(url, "utf8"));
  return bech32.encode("lnurl", words, 1500).toUpperCase();
}

export function formatDate(timestamp: string) {
  const parsedTimestamp = parseInt(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const formattedDate = new Date(parsedTimestamp).toLocaleDateString(
    undefined,
    options
  );
  return formattedDate;
}

export function convertCentsToSats(response: any, cents: number): number {
  const btcSatBase = response.data.realtimePrice.btcSatPrice.base;
  const btcSatBaseOffset = response.data.realtimePrice.btcSatPrice.offset;
  const current = btcSatBase / 10 ** btcSatBaseOffset;
  const sats = cents / current;
  return Math.floor(sats);
}

export const usdFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatOperand(
  operand: string | undefined,
  defaultValue?: string
) {
  if (operand == null || isNaN(Number(operand))) return defaultValue ?? `0.00`;
  const [integer, decimal] = operand.split(".");
  if (decimal == null) {
    return usdFormatter.format(Number(integer));
  }
  return `${usdFormatter.format(Number(integer))}.${decimal}`;
}

export function timeSince(date: number) {
  const seconds = Math.floor((Date.now() - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) {
    return interval + " years ago";
  }

  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + " months ago";
  }

  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + " days ago";
  }

  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + " hours ago";
  }

  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + " minutes ago";
  }

  if (seconds < 10) return "just now";

  return Math.floor(seconds) + " seconds ago";
}
interface Error {
  message: string;
}

export function errorArrayToString(errors: Error[] | undefined): string | null {
  if (errors) {
    return errors.map((error) => error.message).join(", ");
  } else {
    return null;
  }
}

export function generateCode(length: number) {
  const characters =
    "123456789ABCDEFGHIJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

export function formatSecretCode(s: string | null | undefined): string {
  if (!s) {
    return "";
  }
  return s.match(/.{1,4}/g)!.join("-");
}


export function calculateCommission(
  AmountInDollars: string,
  commissionPercentage: string
): string {
  const commissionAmountInDollars =
    Number(AmountInDollars) -
    (Number(AmountInDollars) * Number(commissionPercentage)) / 100;
  return commissionAmountInDollars.toFixed(2);
}


export function getOffset(page: number, limit: number) {
  return (page - 1) * limit;
}