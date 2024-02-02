load "../../helpers/trigger.bash"

@test "trigger: lnds health check" {
  lnd1_starts_before=$(grep_in_trigger_logs "localhost:10009.*lnd.*started" | wc -l)
  lnd2_starts_before=$(grep_in_trigger_logs "localhost:10010.*lnd.*started" | wc -l)

  # Stop trigger
  touch $TRIGGER_STOP_FILE
  retry 10 1 trigger_is_stopped || exit 1

  # Start trigger
  rm $TRIGGER_STOP_FILE
  retry 30 1 trigger_is_started

  lnd1_starts_after=$(grep_in_trigger_logs "localhost:10009.*lnd.*started" | wc -l)
  lnd1_diff="$(( $lnd1_starts_after - $lnd1_starts_before ))"
  [[ "$lnd1_diff" == "1" ]] || exit 1

  lnd2_starts_after=$(grep_in_trigger_logs "localhost:10010.*lnd.*started" | wc -l)
  lnd2_diff="$(( $lnd2_starts_after - $lnd2_starts_before ))"
  [[ "$lnd2_diff" == "1" ]] || exit 1
}
