use anyhow::Result;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use std::collections::HashSet;

use crate::runner::{Har, HarEntry};

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenApiSpec {
    pub openapi: String,
    pub info: OpenApiInfo,
    pub servers: Vec<OpenApiServer>,
    pub paths: IndexMap<String, PathItem>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub components: Option<OpenApiComponents>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenApiInfo {
    pub title: String,
    pub version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenApiServer {
    pub url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PathItem {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub get: Option<Operation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post: Option<Operation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub put: Option<Operation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub delete: Option<Operation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub patch: Option<Operation>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Operation {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parameters: Option<Vec<Parameter>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "requestBody")]
    pub request_body: Option<RequestBody>,
    pub responses: IndexMap<String, Response>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Parameter {
    pub name: String,
    #[serde(rename = "in")]
    pub location: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub required: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schema: Option<Schema>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RequestBody {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub content: IndexMap<String, MediaType>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub required: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Response {
    pub description: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<IndexMap<String, MediaType>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MediaType {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schema: Option<Schema>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub example: Option<JsonValue>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Schema {
    Simple {
        #[serde(rename = "type")]
        schema_type: String,
    },
    Object {
        #[serde(rename = "type")]
        schema_type: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        properties: Option<IndexMap<String, Box<Schema>>>,
        #[serde(skip_serializing_if = "Option::is_none")]
        required: Option<Vec<String>>,
    },
    Array {
        #[serde(rename = "type")]
        schema_type: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        items: Option<Box<Schema>>,
    },
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenApiComponents {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schemas: Option<IndexMap<String, Schema>>,
}

pub struct OpenApiGenerator;

impl OpenApiGenerator {
    pub fn new() -> Self {
        Self
    }

    pub fn from_har(&self, har: &Har) -> Result<OpenApiSpec> {
        let mut paths: IndexMap<String, PathItem> = IndexMap::new();
        let mut servers: HashSet<String> = HashSet::new();

        for entry in &har.log.entries {
            // Extract server URL
            if let Ok(parsed_url) = url::Url::parse(&entry.request.url) {
                let base_url = format!(
                    "{}://{}",
                    parsed_url.scheme(),
                    parsed_url.host_str().unwrap_or("")
                );
                servers.insert(base_url);

                // Extract path
                let path = self.normalize_path(parsed_url.path());

                // Get or create path item
                let path_item = paths.entry(path.clone()).or_insert_with(|| PathItem {
                    get: None,
                    post: None,
                    put: None,
                    delete: None,
                    patch: None,
                });

                // Create operation from entry
                let operation = self.create_operation(entry)?;

                // Assign to appropriate method
                match entry.request.method.to_lowercase().as_str() {
                    "get" => path_item.get = Some(operation),
                    "post" => path_item.post = Some(operation),
                    "put" => path_item.put = Some(operation),
                    "delete" => path_item.delete = Some(operation),
                    "patch" => path_item.patch = Some(operation),
                    _ => {}
                }
            }
        }

        Ok(OpenApiSpec {
            openapi: "3.0.0".to_string(),
            info: OpenApiInfo {
                title: "Generated API".to_string(),
                version: "1.0.0".to_string(),
                description: Some("API specification generated from live responses".to_string()),
            },
            servers: servers
                .into_iter()
                .map(|url| OpenApiServer {
                    url,
                    description: None,
                })
                .collect(),
            paths,
            components: None,
        })
    }

    fn normalize_path(&self, path: &str) -> String {
        // Convert paths like /users/123 to /users/{id}
        let parts: Vec<&str> = path.split('/').collect();
        let normalized_parts: Vec<String> = parts
            .iter()
            .map(|part| {
                if part.parse::<i64>().is_ok() {
                    "{id}".to_string()
                } else if part.len() > 20 {
                    // Likely a UUID or hash
                    "{id}".to_string()
                } else {
                    part.to_string()
                }
            })
            .collect();

        normalized_parts.join("/")
    }

    fn create_operation(&self, entry: &HarEntry) -> Result<Operation> {
        let mut responses: IndexMap<String, Response> = IndexMap::new();

        // Create response from the HAR entry
        let status_code = entry.response.status.to_string();
        let content_type = &entry.response.content.mime_type;

        let mut response_content: IndexMap<String, MediaType> = IndexMap::new();

        if !entry.response.content.text.is_empty() {
            let schema = self.infer_schema(&entry.response.content.text, content_type)?;
            let example = if content_type.contains("json") {
                serde_json::from_str(&entry.response.content.text).ok()
            } else {
                None
            };

            response_content.insert(
                content_type.clone(),
                MediaType { schema, example },
            );
        }

        responses.insert(
            status_code,
            Response {
                description: entry.response.status_text.clone(),
                content: if response_content.is_empty() {
                    None
                } else {
                    Some(response_content)
                },
            },
        );

        // Create request body if present
        let request_body = if let Some(post_data) = &entry.request.post_data {
            let schema = self.infer_schema(&post_data.text, &post_data.mime_type)?;
            let example = if post_data.mime_type.contains("json") {
                serde_json::from_str(&post_data.text).ok()
            } else {
                None
            };

            let mut content: IndexMap<String, MediaType> = IndexMap::new();
            content.insert(
                post_data.mime_type.clone(),
                MediaType { schema, example },
            );

            Some(RequestBody {
                description: None,
                content,
                required: Some(true),
            })
        } else {
            None
        };

        Ok(Operation {
            summary: None,
            description: None,
            tags: None,
            parameters: None,
            request_body,
            responses,
        })
    }

    fn infer_schema(&self, text: &str, content_type: &str) -> Result<Option<Schema>> {
        if content_type.contains("json") {
            if let Ok(json) = serde_json::from_str::<JsonValue>(text) {
                return Ok(Some(self.json_to_schema(&json)));
            }
        }

        Ok(Some(Schema::Simple {
            schema_type: "string".to_string(),
        }))
    }

    fn json_to_schema(&self, json: &JsonValue) -> Schema {
        match json {
            JsonValue::Object(obj) => {
                let mut properties: IndexMap<String, Box<Schema>> = IndexMap::new();
                for (key, value) in obj {
                    properties.insert(key.clone(), Box::new(self.json_to_schema(value)));
                }
                Schema::Object {
                    schema_type: "object".to_string(),
                    properties: Some(properties),
                    required: None,
                }
            }
            JsonValue::Array(arr) => {
                let items = if let Some(first) = arr.first() {
                    Some(Box::new(self.json_to_schema(first)))
                } else {
                    None
                };
                Schema::Array {
                    schema_type: "array".to_string(),
                    items,
                }
            }
            JsonValue::String(_) => Schema::Simple {
                schema_type: "string".to_string(),
            },
            JsonValue::Number(_) => Schema::Simple {
                schema_type: "number".to_string(),
            },
            JsonValue::Bool(_) => Schema::Simple {
                schema_type: "boolean".to_string(),
            },
            JsonValue::Null => Schema::Simple {
                schema_type: "null".to_string(),
            },
        }
    }
}
