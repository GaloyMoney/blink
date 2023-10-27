#!/usr/bin/env bats

load "helpers/setup-and-teardown"

setup_file() {
  clear_cache
  reset_redis

  bitcoind_init
  start_trigger
  start_server

  initialize_user_from_onchain "$ALICE_TOKEN_NAME" "$ALICE_PHONE" "$CODE"
}

teardown_file() {
  stop_trigger
  stop_server
}

@test "earn: mark quiz completed" {
  token_name="$ALICE_TOKEN_NAME" 
  question_id="walletDownloaded"

  # Ensure quiz rewards are disabled and question is not completed
  exec_graphql "$token_name" 'account-quiz'
  rewards_enabled="$(graphql_output '.data.me.defaultAccount.quizRewardsEnabled')"
  [[ "$rewards_enabled" == "false" ]] || exit 1
  quiz_question_completed="$(graphql_output ".data.me.defaultAccount.quiz[] | select(.id == \"$question_id\") | .completed")"
  [[ "$quiz_question_completed" == "false" ]] || exit 1

  # Mark question as completed
  variables=$( 
      jq -n \
      '{input: { id: "'"$question_id"'" }}')

  exec_graphql "$token_name" 'account-quiz-completed' "$variables"
  quiz_question_completed="$(graphql_output '.data.quizCompleted.quiz.completed')"
  [[ "$quiz_question_completed" == "true" ]] || exit 1
  reward_paid="$(graphql_output ".data.quizCompleted.rewardPaid")"
  [[ "$reward_paid" == "false" ]] || exit 1
}
