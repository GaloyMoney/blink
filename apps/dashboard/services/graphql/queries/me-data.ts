import { gql } from "@apollo/client";
import { apollo } from "..";
import { MeDocument, MeQuery } from "../generated";

gql`
  query me {
    me {
      createdAt
      id
      language
      phone
      defaultAccount {
        defaultWalletId
        displayCurrency
        id
        level
        wallets {
          accountId
          balance
          id
          pendingIncomingBalance
          walletCurrency
        }
      }
    }
  }
`;

export async function fetchUserData(token: string) {
  const client = apollo(token).getClient();

  try {
    const data = await client.query<MeQuery>({
      query: MeDocument,
    });
    return data
  } catch (e) {
    if (e instanceof Error) {
      console.error("error", e);
      throw new Error(e.message);
    } else {
      console.error("Unknown error");
      throw new Error("Unknown error");
    }
  }
}
