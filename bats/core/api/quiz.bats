load "../../helpers/bankowner.bash"
load "../../helpers/intraledger.bash"
load "../../helpers/onchain.bash"
load "../../helpers/user.bash"

setup_file() {
  create_user_with_metadata 'alice'
  user_update_username 'alice'
  fund_user_onchain 'alice' 'btc_wallet'

  cache_funder_wallet_id
  fund_wallet_intraledger \
    'alice' \
    "alice.btc_wallet_id" \
    "funder.btc_wallet_id" \
    "10000"
}

@test "quiz: completes a quiz question and gets paid once" {
  token_name="alice"
  question_id="whatIsBitcoin"

  # Check initial balance
  exec_graphql $token_name 'wallets-for-account'
  btc_initial_balance=$(graphql_output '
    .data.me.defaultAccount.wallets[]
    | select(.walletCurrency == "BTC")
    .balance
  ')

  exec_graphql $token_name 'quiz'
  completed=$(graphql_output '.data.me.defaultAccount.quiz' | jq '.[] | select(.id == "whatIsBitcoin") | .completed')
  [[ "${completed}" == "false" ]] || exit 1

  # Do quiz
    variables=$(
    jq -n \
    --arg question_id "$question_id" \
    '{input: {id: $question_id}}'
  )
  exec_graphql "$token_name" 'quiz-claim' "$variables"
  quizzes=$(graphql_output '.data.quizClaim.quizzes')
  [[ "${quizzes}" != "null" ]] || exit 1

  quiz_completed=$(graphql_output '.data.quizClaim.quizzes' | jq '.[] | select(.id == "whatIsBitcoin") | .completed')
  [[ "${quiz_completed}" == "true" ]] || exit 1

  exec_graphql $token_name 'quiz'
  completed=$(graphql_output '.data.me.defaultAccount.quiz' | jq '.[] | select(.id == "whatIsBitcoin") | .completed')
  [[ "${completed}" == "true" ]] || exit 1

  # Check balance after complete
  exec_graphql $token_name 'wallets-for-account'
  btc_balance_after_quiz=$(graphql_output '
    .data.me.defaultAccount.wallets[]
    | select(.walletCurrency == "BTC")
    .balance
  ')
  [[ "$btc_balance_after_quiz" -gt "$btc_initial_balance" ]] || exit 1

  # Check memo
  exec_graphql "$token_name" 'transactions' '{"first": 1}'
  txn_memo=$(graphql_output '.data.me.defaultAccount.transactions.edges[0].node.memo')
  [[ "${txn_memo}" == "${question_id}" ]] || exit 1

  # Retry quiz
  exec_graphql "$token_name" 'quiz-claim' "$variables"
  errors=$(graphql_output '.data.quizClaim.errors')
  [[ "${errors}" != "null" ]] || exit 1
  error_msg=$(graphql_output '.data.quizClaim.errors[0].message')
  [[ "${error_msg}" =~ "already claimed" ]] || exit 1

  # Check balance after retry
  exec_graphql $token_name 'wallets-for-account'
  btc_balance_after_retry=$(graphql_output '
    .data.me.defaultAccount.wallets[]
    | select(.walletCurrency == "BTC")
    .balance
  ')
  [[ "$btc_balance_after_retry" == "$btc_balance_after_quiz" ]] || exit 1

  # Section 1 quiz should not be claimable

  # Do quiz
  question_id="coincidenceOfWants"

  variables=$(
    jq -n \
    --arg question_id "$question_id" \
    '{input: {id: $question_id}}'
  )

  exec_graphql "$token_name" 'quiz-claim' "$variables"
  errors=$(graphql_output '.data.quizClaim.errors')
  [[ "${errors}" != "null" ]] || exit 1
  error_msg=$(graphql_output '.data.quizClaim.errors[0].code')
  [[ "${error_msg}" =~ "QUIZ_CLAIMED_TOO_EARLY" ]] || exit 1
}
