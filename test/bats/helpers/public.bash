BASH_SOURCE=${BASH_SOURCE:-test/bats/helpers/.}
source $(dirname "$BASH_SOURCE")/ln.bash

validate_invoice_for_lnd() {
  pay_req=$1

  node_pubkey="$(lnd_cli getinfo | jq -r '.identity_pubkey')"
  [[ -n "$node_pubkey" && "$node_pubkey" != "null" ]] || exit 1
  invoice_destination="$(lnd_cli decodepayreq $pay_req | jq -r '.destination')"
  [[ -n "$invoice_destination" && "$invoice_destination" != "null" ]] || exit 1

  [[ "$node_pubkey" == "$invoice_destination" ]] || exit 1
}
