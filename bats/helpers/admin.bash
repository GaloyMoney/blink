
HYDRA_PUBLIC_API="http://localhost:4444"
HYDRA_ADMIN_API="http://localhost:4445"

login_admin() {
  client=$(curl -L -s -X POST $HYDRA_ADMIN_API/admin/clients \
    -H 'Content-Type: application/json' \
    -d '{
          "grant_types": ["client_credentials"]
        }')

  client_id=$(echo $client | jq -r '.client_id')
  client_secret=$(echo $client | jq -r '.client_secret')

  admin_token=$(curl -s -X POST $HYDRA_PUBLIC_API/oauth2/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -u "$client_id:$client_secret" \
  -d "grant_type=client_credentials" | jq -r '.access_token'
  )
  echo "admin_token: $admin_token"
  [[ -n "$admin_token" ]] || exit 1
  cache_value 'admin.token' "$admin_token"
}
