NEXTAUTH_URL="http://localhost:3000/"

code_client=$(hydra create client \
    --endpoint http://127.0.0.1:4445 \
    --grant-type authorization_code,refresh_token \
    --response-type code,id_token \
    --format json \
    --scope offline --scope transactions:read --scope payments:send \
    --redirect-uri $NEXTAUTH_URL
)

export CLIENT_ID=$(echo $code_client | jq -r '.client_id')
export CLIENT_SECRET=$(echo $code_client | jq -r '.client_secret')

AUTHORIZATION_URL="http://127.0.0.1:4444/oauth2/auth?client_id=$CLIENT_ID&scope=offline%20transactions:read&response_type=code&redirect_uri=$NEXTAUTH_URL&state=kfISr3GhH0rqheByU6A6hqIG_f14pCGkZLSCUTHnvlI"
echo "export CLIENT_ID=$CLIENT_ID" > ./.env.test
echo "export CLIENT_SECRET=$CLIENT_SECRET" >> ./.env.test
echo "export AUTHORIZATION_URL=$AUTHORIZATION_URL" >> ./.env.test
