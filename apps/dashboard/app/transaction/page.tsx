import { getServerSession } from "next-auth";
import React from "react";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { apollo } from "../../services/graphql";
import Sidebar from "@/components/side-bar";

export default async function page() {
  const session = await getServerSession(authOptions);
  const isAuthed = session?.sub ?? false;
  const token = session?.accessToken;
  const client = apollo(token).getClient();
  if (!isAuthed) {
    return <div>not logged in</div>;
  }

  return <div></div>;
}
