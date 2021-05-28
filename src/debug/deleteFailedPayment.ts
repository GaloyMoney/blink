import { getWalletInfo } from "lightning";
import { deleteFailedPayments, authenticatedLndGrpc } from "ln-service"

// export LND_1_TLS=$(kubectl exec lnd-0 -n testnet  -- base64 /data/.lnd/tls.cert | tr -d '\n\r')
// export LND_1_MACAROON=$(kubectl exec lnd-0 -n testnet -- base64 /data/.lnd/data/chain/bitcoin/testnet/admin.macaroon | tr -d '\n\r')

const fn = async () => {
  try {
    const {lnd} = authenticatedLndGrpc({
      cert: process.env.LND_1_TLS,
      macaroon: process.env.LND_1_MACAROON,
      node: "localhost",
      port: 10009,
    });
  
    console.log(await deleteFailedPayments({lnd}))
  } catch (err) {
    console.log({err})
  }
}

fn()