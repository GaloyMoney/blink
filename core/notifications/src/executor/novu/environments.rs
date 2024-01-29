use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Environment {
    pub _id: String,
    pub name: String,
    pub _organization_id: String,
    pub identifier: String,
    pub api_keys: Vec<ApiKey>,
    pub _parent_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiKey {
    pub key: String,
    pub _user_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentPayload {
    pub name: String,
    pub parent_id: Option<String>,
}
pub struct EnvironmentPayloadBuilder {
    payload: EnvironmentPayload,
}
impl EnvironmentPayloadBuilder {
    pub fn new(name: impl ToString) -> EnvironmentPayloadBuilder {
        Self {
            payload: EnvironmentPayload {
                name: name.to_string(),
                parent_id: None,
            },
        }
    }

    pub fn parent_id(mut self, parent_id: impl ToString) -> EnvironmentPayloadBuilder {
        self.payload.parent_id = Some(parent_id.to_string());
        self
    }

    pub fn build(self) -> EnvironmentPayload {
        self.payload
    }
}
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateEnvironmentPayload {
    pub name: Option<String>,
    pub identifier: Option<String>,
    pub parent_id: Option<String>,
    pub dns: Option<Dns>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Dns {
    pub inbound_parse_domain: Option<String>,
}

pub struct CreateEnvironmentPayloadBuilder {
    payload: CreateEnvironmentPayload,
}

impl CreateEnvironmentPayloadBuilder {
    pub fn new() -> CreateEnvironmentPayloadBuilder {
        Self {
            payload: CreateEnvironmentPayload {
                name: None,
                identifier: None,
                parent_id: None,
                dns: None,
            },
        }
    }

    pub fn name(mut self, name: impl ToString) -> CreateEnvironmentPayloadBuilder {
        self.payload.name = Some(name.to_string());
        self
    }

    pub fn identifier(mut self, identifier: impl ToString) -> CreateEnvironmentPayloadBuilder {
        self.payload.identifier = Some(identifier.to_string());
        self
    }

    pub fn parent_id(mut self, parent_id: impl ToString) -> CreateEnvironmentPayloadBuilder {
        self.payload.parent_id = Some(parent_id.to_string());
        self
    }

    pub fn inbound_parse_domain(
        mut self,
        inbound_parse_domain: impl ToString,
    ) -> CreateEnvironmentPayloadBuilder {
        self.payload.dns = Some(Dns {
            inbound_parse_domain: Some(inbound_parse_domain.to_string()),
        });
        self
    }

    pub fn build(self) -> CreateEnvironmentPayload {
        self.payload
    }
}
impl Default for CreateEnvironmentPayloadBuilder {
    fn default() -> Self {
        Self::new()
    }
}
