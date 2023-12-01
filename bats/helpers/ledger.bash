CURRENT_FILE=${BASH_SOURCE:-bats/helpers/.}
source "$(dirname "$CURRENT_FILE")/_common.bash"
source "$(dirname "$CURRENT_FILE")/cli.bash"

METRICS_ENDPOINT="localhost:3002/metrics"

balance_for_check() {
  redis_cli FLUSHALL > /dev/null 2>&1 || true

  get_metric() {
    metric_name=$1

    retry 10 1 curl -s "$METRICS_ENDPOINT"
    curl -s "$METRICS_ENDPOINT" \
      | awk "/^$metric_name/ { print \$2 }"
  }

  lnd_balance_sync=$(get_metric "galoy_lndBalanceSync")
  is_number "$lnd_balance_sync" "lnd_balance_sync"
  abs_lnd_balance_sync=$(abs $lnd_balance_sync)

  assets_eq_liabilities=$(get_metric "galoy_assetsEqLiabilities")
  is_number "$assets_eq_liabilities" "assets_eq_liabilities"
  abs_assets_eq_liabilities=$(abs $assets_eq_liabilities)

  echo $(( $abs_lnd_balance_sync + $abs_assets_eq_liabilities ))
}
