#!/bin/bash

GRAPHQL_URL="http://localhost:4455/graphql"

login() {
    local phone=$1
    local code=$2
    echo "login ====> code: $code  phone: $phone"

    local queryPayload=$(jq -n \
        --arg phone "$phone" \
        --arg code "$code" \
        '{
            query: "mutation UserLogin($input: UserLoginInput!) { userLogin(input: $input) { authToken errors { code message path } } }",
            variables: {
                input: {
                    phone: $phone,
                    code: $code
                }
            }
        }'
    )

    echo "Sending GraphQL Login Request: $queryPayload"

    local response=$(curl -s -X POST -H "Content-Type: application/json" -d "$queryPayload" $GRAPHQL_URL)
    echo "Login Response: $response"

    local authToken=$(echo $response | jq -r '.data.userLogin.authToken')
    if [ -z "$authToken" ] || [ "$authToken" == "null" ]; then
        echo "Login failed, no auth token received."
        return 1
    fi

    echo "Auth Token: $authToken"
    return 0
}

update_username() {
    local authToken=$1
    local username=$2

    echo "update_username: authtoken: $authToken username: $username"

    local updateMutation='mutation UserUpdateUsername {
        userUpdateUsername(input: { username: "'$username'" }) {
            errors {
                code
                message
                path
            }
            user {
                id
                createdAt
                language
                phone
                totpEnabled
                username
            }
        }
    }'

    curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $authToken" --data '{"query":"'"$updateMutation"'"}' $GRAPHQL_URL
}

users=("+16505554321,000000,alice" "+16505554322,000000,bob" "+16505554323,000000,charlie")

for user in "${users[@]}"; do
    IFS=',' read -ra userInfo <<< "$user"
    phone=${userInfo[0]}
    code=${userInfo[1]}
    username=${userInfo[2]}

    echo "Processing user: $phone code: $code username: $username"

    authToken=$(login $phone $code)
    echo "authToken $authToken"

    if [ -n "$authToken" ]; then
        echo "Updating username to $username"
        response=$(update_username $authToken $username)
        echo "Updating username response: $response"
    else
        echo "Login failed for user: $phone"
    fi
done
