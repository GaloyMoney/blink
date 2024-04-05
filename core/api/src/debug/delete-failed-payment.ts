import { authenticatedLndGrpc, deleteFailedPayAttempts } from "ln-service"

// export LND1_TLS=$(kubectl exec lnd1-0 -n galoy-bbw-bitcoin  -- base64 /root/.lnd/tls.cert | tr -d '\n\r')
// export LND1_MACAROON=$(kubectl exec lnd1-0 -n galoy-bbw-bitcoin -- base64 /root/.lnd/data/chain/bitcoin/mainnet/admin.macaroon | tr -d '\n\r')

const fn = async () => {
  try {
    const { lnd } = authenticatedLndGrpc({
      cert: process.env.LND1_TLS,
      macaroon: process.env.LND1_MACAROON,
      node: "localhost",
      port: 10009,
    })
    console.log(await deleteFailedPayAttempts({ lnd }))
    console.log("completed")
  } catch (err) {
    console.log({ err })
  }
}

fn()
