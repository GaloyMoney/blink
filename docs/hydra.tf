terraform {
  required_providers {
    hydra = {
      source  = "svrakitin/hydra"
      version = "0.1.4"
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
}

output "example_client_id" {
  description = "The client ID of the example OAuth2 client."
  value       = hydra_oauth2_client.example.client_id
}

output "example_client_secret" {
  description = "The client secret of the example OAuth2 client."
  value       = hydra_oauth2_client.example.client_secret
  sensitive   = true
}

resource "hydra_oauth2_client" "example2" {
  client_name                = "example2"
  grant_types                = ["client_credentials"]
  redirect_uris              = ["http://localhost:8080/callback"]
  response_types             = ["token"]
  token_endpoint_auth_method = "client_secret_basic"
}
