CURRENT_FILE=${BASH_SOURCE:-bats/helpers/.}
source "$(dirname "$CURRENT_FILE")/_common.bash"
source "$(dirname "$CURRENT_FILE")/cli.bash"

login_user() {
  local token_name=$1
  local phone=$2

  local code="000000"

  local variables
  variables=$(
    jq -n \
    --arg phone "$phone" \
    --arg code "$code" \
    '{input: {phone: $phone, code: $code}}'
  )
  exec_graphql 'anon' 'user-login' "$variables"
  auth_token="$(graphql_output '.data.userLogin.authToken')"
  [[ -n "${auth_token}" && "${auth_token}" != "null" ]]
  cache_value "$token_name" "$auth_token"

  exec_graphql "$token_name" 'wallets-for-account'

  btc_wallet_id="$(graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "BTC") .id')"
  [[ "${btc_wallet_id}" != "null" ]]
  cache_value "$token_name.btc_wallet_id" "$btc_wallet_id"

  usd_wallet_id="$(graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "USD") .id')"
  [[ "${usd_wallet_id}" != "null" ]]
  cache_value "$token_name.usd_wallet_id" "$usd_wallet_id"
}

create_user() {
  local token_name=$1
  local phone=$(random_phone)

  login_user "$token_name" "$phone"
  cache_value "$token_name.phone" "$phone"
}

create_user_with_metadata() {
  local token_name=$1
  create_user "$token_name"

  # Add phone metadata
  mongo_command=$(echo "db.users.updateOne(
        { phone: \"$(read_value $token_name.phone)\" },
        {
          \$set: {
            phoneMetadata: {
              carrier: { type: \"mobile\" },
              countryCode: \"SV\"
            }
          }
        }
      );" | tr -d '[:space:]')
  mongo_cli "$mongo_command"

  # Add IP metadata
  exec_graphql "$token_name" 'default-account'
  account_id=$(graphql_output '.data.me.defaultAccount.id')

  mongo_command=$(echo "db.accountips.insertOne(
        {
          ip: \"138.186.249.229\",
          accountId: \"$account_id\",
          metadata: {
            isoCode: \"SV\",
            asn: \"AS27773\"
          }
        }
      );" | tr -d '[:space:]')
  mongo_cli "$mongo_command"
}

random_phone() {
  # Generate a valid US area code (avoiding invalid ones like 000, 911, etc.)
  local area_codes=(201 202 203 205 206 207 208 209 210 212 213 214 215 216 217 218 219 220 223 224 225 227 228 229 231 234 239 240 248 251 252 253 254 256 260 262 267 269 270 272 274 276 278 279 281 283 301 302 303 304 305 307 308 309 310 312 313 314 315 316 317 318 319 320 321 323 325 326 327 330 331 332 334 336 337 339 340 341 346 347 351 352 360 361 364 369 380 381 385 386 401 402 404 405 406 407 408 409 410 412 413 414 415 417 419 423 424 425 430 432 434 435 440 442 443 445 447 448 458 463 464 469 470 475 478 479 480 484 501 502 503 504 505 507 508 509 510 512 513 515 516 517 518 520 530 531 534 539 540 541 551 557 559 561 562 563 564 567 570 571 572 573 574 575 580 585 586 601 602 603 605 606 607 608 609 610 612 614 615 616 617 618 619 620 623 626 628 629 630 631 636 641 646 650 651 657 659 660 661 662 667 669 678 681 682 701 702 703 704 706 707 708 712 713 714 715 716 717 718 719 720 724 725 726 727 731 732 734 737 740 743 747 752 754 757 760 762 763 765 769 770 772 773 774 775 779 781 785 786 801 802 803 804 805 806 808 810 812 813 814 815 816 817 818 828 830 831 832 835 843 845 847 848 850 854 856 857 858 859 860 862 863 864 865 870 872 878 901 903 904 906 907 908 909 910 912 913 914 915 916 917 918 919 920 925 928 929 930 931 934 936 937 938 940 941 945 947 949 951 952 954 956 959 970 971 972 973 975 978 979 980 984 985 989)

  # Pick a random area code from the list
  local area_code=${area_codes[$RANDOM % ${#area_codes[@]}]}

  # Generate a random 7-digit local number (avoiding 0 as first digit)
  local exchange=$(( ($RANDOM % 9) + 1 ))$(( $RANDOM % 10 ))$(( $RANDOM % 10 ))
  local subscriber=$(( $RANDOM % 10000 ))

  # Format as +1XXXXXXXXXX
  printf "+1%s%s%04d\n" "$area_code" "$exchange" "$subscriber"
}

user_update_username() {
  local token_name="$1"

  # Check if username is already set an username present
  if read_value "$token_name.username" >/dev/null 2>&1; then
    return
  fi

  local username="${2:-${token_name}_$RANDOM}"

  local variables=$(
    jq -n \
    --arg username "$username" \
    '{input: {username: $username}}'
  )
  exec_graphql "$token_name" 'user-update-username' "$variables"
  num_errors="$(graphql_output '.data.userUpdateUsername.errors | length')"
  [[ "$num_errors" == "0"  ]] || exit 1

  cache_value "$token_name.username" "$username"
}

ensure_username_is_present() {
  local variables=$(
    jq -n \
    --arg username "$1" \
    '{username: $username}'
  )
  exec_graphql 'anon' 'username-available' "$variables"
  username_available="$(graphql_output '.data.usernameAvailable')"

  if [[ "$username_available" == "true" ]]; then
    create_user "$1"
    user_update_username "$1" "$1"
  fi
}

is_contact() {
  local token_name="$1"
  local contact_username="$(read_value "$2.username")"

  exec_graphql "$token_name" 'contacts'
  local fetched_username=$(
    graphql_output \
    --arg contact_username "$contact_username" \
    '.data.me.contacts[] | select(.username == $contact_username) .username'
  )
  [[ "$fetched_username" == "$contact_username" ]] || return 1
}
