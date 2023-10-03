import type { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";

type Data = {
  status: string;
};
// TODO add CSRF
export function POST(request: Request) {
  console.log("invalid CSRF");
  return NextResponse.json({ status: "invalid csrf token" });
}
