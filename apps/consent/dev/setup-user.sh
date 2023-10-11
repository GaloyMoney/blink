#!/bin/bash
PHONE="+16505554350"
CODE="000000"
EMAIL="test@galoy.com"  
GRAPHQL_ENDPOINT="http://localhost:4002/graphql"
AUTH_ENDPOINT="http://localhost:4002/auth/phone/login"
DB_CONTAINER="api-kratos-pg-1"
DB_USER="dbuser"
DB_NAME="default"
LOG_FILE="script.log"
> $LOG_FILE

# Step-------- 1: Login and get authToken
login_response=$(curl -s -X POST $AUTH_ENDPOINT -H "Content-Type: application/json" -d '{"phone": "'$PHONE'", "code":"'$CODE'"}')
echo "Step 1 Response: $login_response" >> $LOG_FILE
auth_token=$(echo $login_response | jq -r '.authToken')


# Step------ 2: Call GraphQL mutation UserEmailRegistrationInitiate
email_reg_init_response=$(curl -s -X POST $GRAPHQL_ENDPOINT -H "Content-Type: application/json" -H "Authorization: Bearer $auth_token" -d '
{
  "query": "mutation UserEmailRegistrationInitiate { userEmailRegistrationInitiate(input: { email: \"'$EMAIL'\" }) { emailRegistrationId errors { code message path } me { createdAt id language phone totpEnabled username } } }"
}')
echo "Step 2 Response: $email_reg_init_response" >> $LOG_FILE
email_registration_id=$(echo $email_reg_init_response | jq -r '.data.userEmailRegistrationInitiate.emailRegistrationId')

# Step---------- 3: Get the code from the email
email_code_response=$(docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT body FROM courier_messages WHERE recipient='$EMAIL' ORDER BY created_at DESC LIMIT 1;")
echo "Step 3 Response: $email_code_response" >> $LOG_FILE
email_code=$(echo "$email_code_response" | grep -oP '\d{6}')
echo "Email Code: $email_code" >> $LOG_FILE  # Logging the email code

# Step---------- 4: Call GraphQL mutation UserEmailRegistrationValidate
email_reg_validate_response=$(curl -s -X POST $GRAPHQL_ENDPOINT \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $auth_token" \
-d '{"query": "mutation UserEmailRegistrationValidate { userEmailRegistrationValidate( input: { code: \"'"$email_code"'\" emailRegistrationId: \"'"$email_registration_id"'\" }) { errors { code message path } } }"}')
echo "Step 4 Response: $email_reg_validate_response" >> $LOG_FILE

echo $email_reg_validate_response