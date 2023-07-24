/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "loginFromPhoneAndCode"] }] */

import { Accounts } from "@app"
import { WalletType } from "@domain/wallets"
import { toSats } from "@domain/bitcoin"
import { DisplayCurrency, toCents } from "@domain/fiat"
import { WalletCurrency } from "@domain/shared"

import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core"

import { Subscription } from "zen-observable-ts"

import { sleep } from "@utils"

import { gql } from "apollo-server-core"

import {
  createApolloClient,
  defaultStateConfig,
  defaultTestClientConfig,
  initializeTestingState,
  killServer,
  startServer,
} from "test/e2e/helpers"
import {
  bitcoindClient,
  clearAccountLocks,
  clearLimiters,
  fundWalletIdFromLightning,
  getAccountByTestUserRef,
  getDefaultWalletIdByTestUserRef,
  getPhoneAndCodeFromRef,
  lndOutside1,
  pay,
} from "test/helpers"
import { loginFromPhoneAndCode } from "test/e2e/helpers/account-creation"
import {
  LnInvoiceCreateDocument,
  LnInvoiceCreateMutation,
  LnNoAmountInvoiceCreateDocument,
  LnNoAmountInvoiceCreateMutation,
  LnUsdInvoiceCreateDocument,
  LnUsdInvoiceCreateMutation,
  MainQueryDocument,
  MainQueryQuery,
  UserLoginDocument,
  UserLoginMutation,
  MeDocument,
  MeQuery,
  MyUpdatesDocument,
  MyUpdatesSubscription,
  TransactionsQuery,
  TransactionsDocument,
} from "test/e2e/generated"

let apolloClient: ApolloClient<NormalizedCacheObject>,
  disposeClient: () => void = () => null,
  walletId: WalletId,
  usdWalletId: WalletId,
  serverPid: PID,
  triggerPid: PID,
  serverWsPid: PID

const userRef = "K"
const { phone, code } = getPhoneAndCodeFromRef(userRef)

const otherRef = "A"
const { phone: phoneOther, code: codeOther } = getPhoneAndCodeFromRef(otherRef)

const satsAmount = toSats(50_000)
const centsAmount = toCents(4_000)

beforeAll(async () => {
  await initializeTestingState(defaultStateConfig())
  serverPid = await startServer("start-main-ci")
  triggerPid = await startServer("start-trigger-ci")
  serverWsPid = await startServer("start-ws-ci")
})

beforeEach(async () => {
  await clearLimiters()
  await clearAccountLocks()
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
  disposeClient()
  await killServer(serverPid)
  await killServer(triggerPid)
  await killServer(serverWsPid)

  await sleep(2000)
})

gql`
  mutation UserLogin($input: UserLoginInput!) {
    userLogin(input: $input) {
      errors {
        message
      }
      authToken
    }
  }

  query mainQuery($hasToken: Boolean!) {
    globals {
      ### deprecated
      nodesIds
      ###

      network
      feesInformation {
        deposit {
          minBankFee
          minBankFeeThreshold
          ratio
        }
      }
    }

    ### deprecated
    quizQuestions {
      id
      earnAmount
    }
    ###

    me @include(if: $hasToken) {
      id
      language
      username
      phone

      ### deprecated
      quizQuestions {
        question {
          id
          earnAmount
        }
        completed
      }
      ###

      defaultAccount {
        ... on ConsumerAccount {
          quiz {
            id
            amount
            completed
          }
        }
        id
        level
        defaultWalletId
        wallets {
          id
          balance
          walletCurrency
          transactions(first: 3) {
            ...TransactionList
          }
        }
      }
    }
    mobileVersions {
      platform
      currentSupported
      minSupported
    }
  }

  query me {
    me {
      defaultAccount {
        defaultWalletId
        level
        wallets {
          id
          walletCurrency
        }
      }
    }
  }

  query transactions($walletIds: [WalletId], $first: Int, $after: String) {
    me {
      defaultAccount {
        defaultWalletId
        transactions(walletIds: $walletIds, first: $first, after: $after) {
          ...TransactionList
        }
      }
    }
  }

  fragment TransactionList on TransactionConnection {
    pageInfo {
      hasNextPage
    }
    edges {
      cursor
      node {
        __typename
        id
        status
        direction
        memo
        createdAt
        settlementAmount
        settlementFee
        settlementDisplayAmount
        settlementDisplayFee
        settlementDisplayCurrency
        settlementCurrency
        settlementPrice {
          base
          offset
        }
        initiationVia {
          __typename
          ... on InitiationViaIntraLedger {
            counterPartyWalletId
            counterPartyUsername
          }
          ... on InitiationViaLn {
            paymentHash
          }
          ... on InitiationViaOnChain {
            address
          }
        }
        settlementVia {
          __typename
          ... on SettlementViaIntraLedger {
            counterPartyWalletId
            counterPartyUsername
          }
          ... on SettlementViaLn {
            paymentSecret
          }
          ... on SettlementViaOnChain {
            transactionHash
          }
        }
      }
    }
  }
`

describe("setup", () => {
  it("create main user", async () => {
    await loginFromPhoneAndCode({ phone, code })
  })

  it("create other", async () => {
    await loginFromPhoneAndCode({ phone: phoneOther, code: codeOther })
  })

  it("fund user", async () => {
    const account = await getAccountByTestUserRef(userRef)
    const usdWallet = await Accounts.addWalletIfNonexistent({
      accountId: account.id,
      type: WalletType.Checking,
      currency: WalletCurrency.Usd,
    })
    if (usdWallet instanceof Error) throw usdWallet
    usdWalletId = usdWallet.id
    walletId = await getDefaultWalletIdByTestUserRef(userRef)

    await fundWalletIdFromLightning({ walletId, amount: satsAmount })
    ;({ apolloClient, disposeClient } = createApolloClient(defaultTestClientConfig()))
    const input = { phone, code }
    const result = await apolloClient.mutate<UserLoginMutation>({
      mutation: UserLoginDocument,
      variables: { input },
    })

    // Create a new authenticated client
    disposeClient()
    const authToken = (result?.data?.userLogin.authToken as AuthToken) ?? undefined

    ;({ apolloClient, disposeClient } = createApolloClient(
      defaultTestClientConfig(authToken),
    ))
    const meResult = await apolloClient.query<MeQuery>({ query: MeDocument })
    expect(meResult?.data?.me?.defaultAccount.defaultWalletId).toBe(walletId)
  })
})

describe("graphql", () => {
  describe("main query", () => {
    it("returns valid data", async () => {
      const { errors, data } = await apolloClient.query<MainQueryQuery>({
        query: MainQueryDocument,
        variables: { hasToken: true },
      })
      expect(errors).toBeUndefined()

      expect(data.globals).toBeTruthy()
      expect(data.me).toBeTruthy()
      expect(data.mobileVersions).toBeTruthy()
      expect(data.quizQuestions).toBeTruthy()

      expect(data?.globals?.nodesIds).toEqual(
        expect.arrayContaining([expect.any(String)]),
      )
      expect(data.me).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          language: expect.any(String),
          phone: expect.stringContaining("+1"),
        }),
      )
      expect(data?.me?.defaultAccount).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          defaultWalletId: expect.any(String),
        }),
      )

      expect(data?.me?.defaultAccount.quiz).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            amount: expect.any(Number),
            completed: expect.any(Boolean),
          }),
        ]),
      )
      expect(data?.me?.defaultAccount.wallets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            balance: expect.any(Number),
            walletCurrency: expect.any(String),
            transactions: expect.objectContaining({
              edges: expect.arrayContaining([
                expect.objectContaining({
                  cursor: expect.any(String),
                  node: expect.objectContaining({
                    id: expect.any(String),
                    direction: expect.any(String),
                    status: expect.any(String),
                    settlementAmount: expect.any(Number),
                    settlementFee: expect.any(Number),
                    settlementDisplayAmount: expect.any(String),
                    settlementDisplayFee: expect.any(String),
                    settlementDisplayCurrency: DisplayCurrency.Usd,
                    createdAt: expect.any(Number),
                  }),
                }),
              ]),
              pageInfo: expect.any(Object),
            }),
          }),
        ]),
      )

      expect(data.mobileVersions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            currentSupported: expect.any(Number),
            minSupported: expect.any(Number),
            platform: expect.any(String),
          }),
        ]),
      )
      expect(data.quizQuestions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            earnAmount: expect.any(Number),
          }),
        ]),
      )
    })
  })

  describe("transactionsByWalletId selection in 'me' query", () => {
    it("returns valid data for walletIds passed", async () => {
      const { errors, data: meData } = await apolloClient.query<MeQuery>({
        query: MeDocument,
      })
      expect(errors).toBeUndefined()

      const wallets = meData?.me?.defaultAccount?.wallets ?? []
      expect(wallets).toBeTruthy()
      for (const wallet of wallets) {
        if (wallet.walletCurrency === WalletCurrency.Usd) {
          await fundWalletIdFromLightning({
            walletId: wallet.id as WalletId,
            amount: centsAmount,
          })
        }
      }

      const { data } = await apolloClient.query<TransactionsQuery>({
        query: TransactionsDocument,
        variables: { walletIds: wallets.map((wallet) => wallet.id), first: 5 },
      })

      const txns = data?.me?.defaultAccount.transactions?.edges
      expect(txns).toBeTruthy()
      expect(txns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            node: expect.objectContaining({
              settlementAmount: 4_000,
              settlementCurrency: WalletCurrency.Usd,
              settlementDisplayAmount: "40.00",
              settlementDisplayFee: "0.00",
              settlementDisplayCurrency: DisplayCurrency.Usd,
            }),
          }),
          expect.objectContaining({
            node: expect.objectContaining({
              settlementAmount: 50_000,
              settlementCurrency: WalletCurrency.Btc,
              settlementDisplayAmount: expect.any(String),
              settlementDisplayFee: expect.any(String),
              settlementDisplayCurrency: DisplayCurrency.Usd,
            }),
          }),
        ]),
      )
    })

    it("returns valid data for no walletIds passed", async () => {
      const { errors, data: meData } = await apolloClient.query<MeQuery>({
        query: MeDocument,
      })
      expect(errors).toBeUndefined()

      const wallets = meData?.me?.defaultAccount.wallets ?? []
      expect(wallets).toBeTruthy()
      for (const wallet of wallets) {
        if (wallet.walletCurrency === WalletCurrency.Usd) {
          await fundWalletIdFromLightning({
            walletId: wallet.id as WalletId,
            amount: centsAmount,
          })
        }
      }

      const { data } = await apolloClient.query<TransactionsQuery>({
        query: TransactionsDocument,
        variables: { first: 100 },
      })

      const txns = data?.me?.defaultAccount.transactions?.edges
      expect(txns).toBeTruthy()
      expect(txns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            node: expect.objectContaining({
              settlementAmount: 4_000,
              settlementCurrency: WalletCurrency.Usd,
            }),
          }),
          expect.objectContaining({
            node: expect.objectContaining({
              settlementAmount: 50_000,
              settlementCurrency: WalletCurrency.Btc,
            }),
          }),
        ]),
      )
    })

    it("returns valid data using after cursor", async () => {
      const { errors, data: meData } = await apolloClient.query<MeQuery>({
        query: MeDocument,
      })
      expect(errors).toBeUndefined()

      const wallets = meData?.me?.defaultAccount.wallets ?? []
      expect(wallets).toBeTruthy()
      for (const wallet of wallets) {
        if (wallet.walletCurrency === WalletCurrency.Usd) {
          await fundWalletIdFromLightning({
            walletId: wallet.id as WalletId,
            amount: centsAmount,
          })
        }
      }

      const { data } = await apolloClient.query<TransactionsQuery>({
        query: TransactionsDocument,
        variables: { first: 100 },
      })

      const txns = data?.me?.defaultAccount.transactions?.edges
      expect(txns).toBeTruthy()
      if (!txns) throw new Error("invalid data")

      const firstTxCursor = txns[0].cursor
      {
        const { data, errors } = await apolloClient.query<TransactionsQuery>({
          query: TransactionsDocument,
          variables: { after: firstTxCursor },
        })

        expect(data?.me?.defaultAccount.transactions).toBeTruthy()
        expect(errors).toBeUndefined()
      }
    })

    it("returns error for invalid after cursor", async () => {
      const { data, errors } = await apolloClient.query<TransactionsQuery>({
        query: TransactionsDocument,
        variables: {
          after: "86fe6c5ee72b41a934c84b127c8c4bf5fd75c077b4c9ab0cd53b1b93e7becedf",
        },
      })

      expect(data?.me?.defaultAccount.transactions).toBeNull()
      expect(errors).not.toBeUndefined()
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "INVALID_INPUT",
            message: `Argument "after" must be a valid cursor`,
          }),
        ]),
      )
    })

    it("returns an error if non-owned walletId is included", async () => {
      const expectedErrorMessage = "Invalid walletId for account."
      const otherWalletId = await getDefaultWalletIdByTestUserRef(otherRef)

      const walletIdsCases = [
        [otherWalletId, walletId],
        [otherWalletId],
        [walletId, otherWalletId],
      ]

      for (const walletIds of walletIdsCases) {
        const { data, errors } = await apolloClient.query<TransactionsQuery>({
          query: TransactionsDocument,
          variables: { walletIds, first: 100 },
        })
        expect(data?.me?.defaultAccount.transactions).toBeNull()
        expect(errors).not.toBeUndefined()
        if (errors == undefined) throw new Error("'errors' property missing")

        expect(errors[0].message).toBe(expectedErrorMessage)
      }
    })
  })

  describe("lnNoAmountInvoiceCreate", () => {
    gql`
      mutation LnNoAmountInvoiceCreate($input: LnNoAmountInvoiceCreateInput!) {
        lnNoAmountInvoiceCreate(input: $input) {
          errors {
            message
          }
          invoice {
            paymentRequest
            paymentHash
            paymentSecret
          }
        }
      }
    `

    it("returns a valid lightning invoice", async () => {
      const input = { walletId, memo: "This is a lightning invoice" }
      const result = await apolloClient.mutate<LnNoAmountInvoiceCreateMutation>({
        mutation: LnNoAmountInvoiceCreateDocument,
        variables: { input },
      })
      const lnNoAmountInvoiceCreate = result?.data?.lnNoAmountInvoiceCreate
      if (!lnNoAmountInvoiceCreate) throw new Error("lnNoAmountInvoiceCreate is null")
      const { invoice, errors } = lnNoAmountInvoiceCreate
      expect(errors).toHaveLength(0)
      expect(invoice).toHaveProperty("paymentRequest")
      expect(invoice?.paymentRequest.startsWith("lnbc")).toBeTruthy()
      expect(invoice).toHaveProperty("paymentHash")
      expect(invoice).toHaveProperty("paymentSecret")
    })

    it("returns a valid lightning invoice if memo is not passed", async () => {
      const input = { walletId }
      const result = await apolloClient.mutate<LnNoAmountInvoiceCreateMutation>({
        mutation: LnNoAmountInvoiceCreateDocument,
        variables: { input },
      })
      const lnNoAmountInvoiceCreate = result?.data?.lnNoAmountInvoiceCreate
      if (!lnNoAmountInvoiceCreate) throw new Error("lnNoAmountInvoiceCreate is null")
      const { invoice, errors } = lnNoAmountInvoiceCreate
      expect(errors).toHaveLength(0)
      expect(invoice).toHaveProperty("paymentRequest")
      expect(invoice?.paymentRequest.startsWith("lnbc")).toBeTruthy()
      expect(invoice).toHaveProperty("paymentHash")
      expect(invoice).toHaveProperty("paymentSecret")
    })
  })

  describe("lnInvoiceCreate", () => {
    gql`
      mutation LnInvoiceCreate($input: LnInvoiceCreateInput!) {
        lnInvoiceCreate(input: $input) {
          errors {
            message
          }
          invoice {
            paymentRequest
            paymentHash
            paymentSecret
          }
        }
      }
    `

    it("returns a valid lightning invoice", async () => {
      const input = { walletId, amount: 1000, memo: "This is a lightning invoice" }
      const result = await apolloClient.mutate<LnInvoiceCreateMutation>({
        mutation: LnInvoiceCreateDocument,
        variables: { input },
      })
      const lnInvoiceCreate = result?.data?.lnInvoiceCreate
      if (!lnInvoiceCreate) throw new Error("lnInvoiceCreate is null")
      const { invoice, errors } = lnInvoiceCreate
      expect(errors).toHaveLength(0)
      expect(invoice).toHaveProperty("paymentRequest")
      expect(invoice?.paymentRequest.startsWith("lnbcrt10")).toBeTruthy()
      expect(invoice).toHaveProperty("paymentHash")
      expect(invoice).toHaveProperty("paymentSecret")
    })

    it("returns a valid lightning invoice if memo is not passed", async () => {
      const input = { walletId, amount: 1000 }
      const result = await apolloClient.mutate<LnInvoiceCreateMutation>({
        mutation: LnInvoiceCreateDocument,
        variables: { input },
      })
      const lnInvoiceCreate = result?.data?.lnInvoiceCreate
      if (!lnInvoiceCreate) throw new Error("lnInvoiceCreate is null")
      const { invoice, errors } = lnInvoiceCreate
      expect(errors).toHaveLength(0)
      expect(invoice).toHaveProperty("paymentRequest")
      expect(invoice?.paymentRequest.startsWith("lnbcrt10")).toBeTruthy()
      expect(invoice).toHaveProperty("paymentHash")
      expect(invoice).toHaveProperty("paymentSecret")
    })

    it("returns an error if amount is negative", async () => {
      const message = "Invalid value for SatAmount"
      const input = { walletId, amount: -1, memo: "This is a lightning invoice" }
      const result = await apolloClient.mutate<LnInvoiceCreateMutation>({
        mutation: LnInvoiceCreateDocument,
        variables: { input },
      })
      const lnInvoiceCreate = result?.data?.lnInvoiceCreate
      if (!lnInvoiceCreate) throw new Error("lnInvoiceCreate is null")
      const { invoice, errors } = lnInvoiceCreate
      expect(errors).toHaveLength(1)
      expect(invoice).toBe(null)
      expect(errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )
    })

    it("returns an error if amount is zero", async () => {
      const message = "A valid satoshi amount is required"
      const input = { walletId, amount: 0, memo: "This is a lightning invoice" }
      const result = await apolloClient.mutate<LnInvoiceCreateMutation>({
        mutation: LnInvoiceCreateDocument,
        variables: { input },
      })
      const lnInvoiceCreate = result?.data?.lnInvoiceCreate
      if (!lnInvoiceCreate) throw new Error("lnInvoiceCreate is null")
      const { invoice, errors } = lnInvoiceCreate
      expect(errors).toHaveLength(1)
      expect(invoice).toBe(null)
      expect(errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )
    })
  })

  describe("lnUsdInvoiceCreate", () => {
    gql`
      mutation LnUsdInvoiceCreate($input: LnUsdInvoiceCreateInput!) {
        lnUsdInvoiceCreate(input: $input) {
          errors {
            message
          }
          invoice {
            paymentRequest
            paymentHash
            paymentSecret
          }
        }
      }
    `
    it("returns a valid lightning invoice", async () => {
      const input = {
        walletId: usdWalletId,
        amount: 1000,
        memo: "This is a lightning invoice",
      }
      const result = await apolloClient.mutate<LnUsdInvoiceCreateMutation>({
        mutation: LnUsdInvoiceCreateDocument,
        variables: { input },
      })
      const lnUsdInvoiceCreate = result?.data?.lnUsdInvoiceCreate
      if (!lnUsdInvoiceCreate) throw new Error("lnUsdInvoiceCreate is null")
      const { invoice, errors } = lnUsdInvoiceCreate
      expect(errors).toHaveLength(0)
      expect(invoice).toHaveProperty("paymentRequest")
      expect(invoice?.paymentRequest.startsWith("lnbcrt")).toBeTruthy()
      expect(invoice).toHaveProperty("paymentHash")
      expect(invoice).toHaveProperty("paymentSecret")
    })
  })

  describe("Trigger + receiving payment", () => {
    afterAll(async () => {
      jest.restoreAllMocks()
    })

    it("receive a payment and subscription update", async () => {
      gql`
        subscription myUpdates {
          myUpdates {
            errors {
              message
            }
            me {
              id
              defaultAccount {
                id
                wallets {
                  id
                  walletCurrency
                  balance
                }
              }
            }
            update {
              type: __typename
              ... on Price {
                base
                offset
                currencyUnit
                formattedAmount
              }
              ... on RealtimePrice {
                id
                timestamp
                denominatorCurrency
                btcSatPrice {
                  base
                  offset
                  currencyUnit
                }
                usdCentPrice {
                  base
                  offset
                  currencyUnit
                }
              }
              ... on LnUpdate {
                paymentHash
                status
              }
              ... on OnChainUpdate {
                txNotificationType
                txHash
                amount
                usdPerSat
              }
              ... on IntraLedgerUpdate {
                txNotificationType
                amount
                usdPerSat
              }
            }
          }
        }
      `

      const input = { walletId, amount: 1000, memo: "This is a lightning invoice" }
      const result = await apolloClient.mutate<LnInvoiceCreateMutation>({
        mutation: LnInvoiceCreateDocument,
        variables: { input },
      })
      const { invoice } = result?.data?.lnInvoiceCreate ?? {}

      const observable = apolloClient.subscribe<MyUpdatesSubscription>({
        query: MyUpdatesDocument,
      })

      let status = ""
      let hash = ""

      const promisePay = pay({
        lnd: lndOutside1,
        request: invoice?.paymentRequest,
      })

      await new Promise((resolve, reject) => {
        const res: Subscription = observable.subscribe(
          async (data) => {
            // onNext()
            let i: number
            for (i = 0; i < 200; i++) {
              if (data?.data?.myUpdates?.update?.type !== "LnUpdate") {
                await sleep(10)
              } else {
                status = data.data.myUpdates.update.status
                hash = data.data.myUpdates.update.paymentHash
                break
              }
            }
            resolve(res) // test will fail if we didn't received the update
            res.unsubscribe()
          },
          () => {
            res.unsubscribe()
            reject(res)
          },
          () => {
            res.unsubscribe()
            reject(res)
          },
        )
      })

      expect(status).toBe("PAID")
      const result2 = await promisePay
      expect(hash).toBe(result2.id)
    })
  })
})
