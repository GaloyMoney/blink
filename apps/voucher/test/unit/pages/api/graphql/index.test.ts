import { GET_WITHDRAW_LINK } from "@/utils/graphql/query";
import { CREATE_WITHDRAW_LINK } from "@/utils/graphql/mutation";
import { DELETE_WITHDRAW_LINK } from "@/utils/graphql/mutation";
import { GET_WITHDRAW_LINKS_BY_USER_ID } from "@/utils/graphql/query";
import { server } from "@/pages/api/graphql/index";
import { generateRandomHash } from "@/utils/helpers";
import { v4 as uuidv4 } from "uuid";

const random_hash = generateRandomHash();
const uuid = uuidv4();
const user_id = "aaaaaaa1-e098-4a16-932b-e4f4abc24366";

function getExpectedData(propertyName: string) {
  return expect.objectContaining({
    singleResult: expect.objectContaining({
      data: expect.objectContaining({
        [propertyName]: expect.objectContaining({
          id: uuid,
        }),
      }),
    }),
  });
}

describe("GraphQL API Tests", () => {
  it("returns data as expected for createWithdrawLink mutation", async () => {
    const variables = {
      input: {
        id: uuid,
        payment_hash: random_hash,
        user_id: user_id,
        payment_request: "paymentRequest",
        payment_secret: "paymentSecret",
        sales_amount: 12,
        account_type: "account",
        escrow_wallet: "wallet",
        title: `Galoy withdraw test`,
        voucher_amount: 12,
        unique_hash: random_hash,
        k1: random_hash,
        commission_percentage: 12,
      },
    };

    const response = await server.executeOperation({
      query: CREATE_WITHDRAW_LINK,
      variables,
    });
    expect(response.body).toMatchObject(getExpectedData("createWithdrawLink"));
  });

  it("returns data as expected for getWithdrawLink query", async () => {
    const variables = {
      getWithdrawLinkId: uuid,
    };

    const response = await server.executeOperation({
      query: GET_WITHDRAW_LINK,
      variables,
    });

    expect(response.body).toMatchObject(getExpectedData("getWithdrawLink"));
  });

  it("returns data as expected for getWithdrawLinksByUserId query", async () => {
    const variables = {
      userId: user_id,
    };

    const response = await server.executeOperation({
      query: GET_WITHDRAW_LINKS_BY_USER_ID,
      variables,
    });

    expect(response.body).toMatchObject(
      expect.objectContaining({
        singleResult: expect.objectContaining({
          data: expect.objectContaining({
            getWithdrawLinksByUserId: expect.objectContaining({
              withdrawLinks: expect.arrayContaining([
                expect.objectContaining({
                  id: uuid,
                }),
              ]),
            }),
          }),
        }),
      })
    );
  });

  it("returns data as expected for deleteWithdrawLink query", async () => {
    const variables = {
      id: uuid,
    };

    const response = await server.executeOperation({
      query: DELETE_WITHDRAW_LINK,
      variables,
    });

    expect(response.body).toMatchObject(
      expect.objectContaining({
        singleResult: expect.objectContaining({
          data: expect.objectContaining({
            deleteWithdrawLink: uuid,
          }),
        }),
      })
    );
  });
});
