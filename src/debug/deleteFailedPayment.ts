import { authenticatedLndGrpc, deleteFailedPayments } from "ln-service"

// export LND1_TLS=$(kubectl exec lnd-0 -n mainnet  -- base64 /root/.lnd/tls.cert | tr -d '\n\r')
// export LND1_MACAROON=$(kubectl exec lnd-0 -n mainnet -- base64 /root/.lnd/data/chain/bitcoin/mainnet/admin.macaroon | tr -d '\n\r')

const fn = async () => {
  try {
    const { lnd } = authenticatedLndGrpc({
      cert: process.env.LND1_TLS,
      macaroon: process.env.LND1_MACAROON,
      node: "localhost",
      port: 10009,
    })
    console.log(await deleteFailedPayments({ lnd }))
  } catch (err) {
    console.log({ err })
  }
}

fn()
