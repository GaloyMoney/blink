terraform {
  required_providers {
    hydra = {
      source  = "svrakitin/hydra"
      version = "0.5.2"
    }
  }
}

provider "hydra" {
  endpoint = "http://localhost:4445"
}

resource "hydra_oauth2_client" "example" {
  client_name                = "example"
  redirect_uris              = ["http://localhost:8080/callback"]
  response_types             = ["code"]
  token_endpoint_auth_method = "none"
  skip_consent               = true
}

output "blink_app_client_id" {
  value = hydra_oauth2_client.example.client_id
}

output "blink_app_client_secret" {
  value     = hydra_oauth2_client.example.client_secret
  sensitive = true
}

resource "hydra_oauth2_client" "blink_app" {
  client_name                = "blink_app"
  grant_types                = ["client_credentials"]
  response_types             = ["token"]
  token_endpoint_auth_method = "client_secret_basic"
  scopes                     = ["editor"]
  skip_consent               = true
}
