use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::SystemTime;

use crate::collection::{
    Environment, PostmanCollection, Request, RequestItem, Url,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct Har {
    pub log: HarLog,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HarLog {
    pub version: String,
    pub creator: HarCreator,
    pub entries: Vec<HarEntry>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HarCreator {
    pub name: String,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HarEntry {
    #[serde(rename = "startedDateTime")]
    pub started_date_time: String,
    pub time: f64,
    pub request: HarRequest,
    pub response: HarResponse,
    pub cache: serde_json::Value,
    pub timings: HarTimings,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HarRequest {
    pub method: String,
    pub url: String,
    #[serde(rename = "httpVersion")]
    pub http_version: String,
    pub headers: Vec<HarHeader>,
    #[serde(rename = "queryString")]
    pub query_string: Vec<HarQueryParam>,
    #[serde(rename = "headersSize")]
    pub headers_size: i32,
    #[serde(rename = "bodySize")]
    pub body_size: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "postData")]
    pub post_data: Option<HarPostData>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HarResponse {
    pub status: u16,
    #[serde(rename = "statusText")]
    pub status_text: String,
    #[serde(rename = "httpVersion")]
    pub http_version: String,
    pub headers: Vec<HarHeader>,
    pub content: HarContent,
    #[serde(rename = "redirectURL")]
    pub redirect_url: String,
    #[serde(rename = "headersSize")]
    pub headers_size: i32,
    #[serde(rename = "bodySize")]
    pub body_size: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HarHeader {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HarQueryParam {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HarPostData {
    #[serde(rename = "mimeType")]
    pub mime_type: String,
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HarContent {
    pub size: i32,
    #[serde(rename = "mimeType")]
    pub mime_type: String,
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HarTimings {
    pub send: f64,
    pub wait: f64,
    pub receive: f64,
}

pub struct CollectionRunner {
    collection: PostmanCollection,
    variables: HashMap<String, String>,
}

impl CollectionRunner {
    pub fn new(collection: PostmanCollection, environment: Option<Environment>) -> Self {
        let mut variables = HashMap::new();

        // Load collection variables
        if let Some(vars) = &collection.variable {
            for var in vars {
                variables.insert(var.key.clone(), var.value.clone());
            }
        }

        // Load environment variables (override collection variables)
        if let Some(env) = environment {
            for var in env.values {
                variables.insert(var.key.clone(), var.value.clone());
            }
        }

        Self {
            collection,
            variables,
        }
    }

    pub async fn run(&self) -> Result<Har> {
        let requests = self.collection.get_all_requests();
        let mut entries = Vec::new();

        println!("Running {} requests...", requests.len());

        for (idx, request_item) in requests.iter().enumerate() {
            println!("[{}/{}] {}", idx + 1, requests.len(), request_item.name);

            match self.execute_request(request_item).await {
                Ok(entry) => {
                    println!("  ✓ {} {}", entry.response.status, entry.response.status_text);
                    entries.push(entry);
                }
                Err(e) => {
                    eprintln!("  ✗ Failed: {}", e);
                }
            }
        }

        Ok(Har {
            log: HarLog {
                version: "1.2".to_string(),
                creator: HarCreator {
                    name: "api-specs".to_string(),
                    version: env!("CARGO_PKG_VERSION").to_string(),
                },
                entries,
            },
        })
    }

    async fn execute_request(&self, request_item: &RequestItem) -> Result<HarEntry> {
        let request = match &request_item.request {
            Request::Simple(url) => {
                return Err(anyhow::anyhow!("Simple URL requests not yet supported: {}", url));
            }
            Request::Full(req) => req,
        };

        let url = self.resolve_url(&request.url)?;
        let method = request.method.to_uppercase();

        let client = reqwest::Client::builder()
            .danger_accept_invalid_certs(true)
            .build()?;

        let start_time = SystemTime::now();
        let started_date_time = chrono::Utc::now().to_rfc3339();

        let mut req_builder = match method.as_str() {
            "GET" => client.get(&url),
            "POST" => client.post(&url),
            "PUT" => client.put(&url),
            "DELETE" => client.delete(&url),
            "PATCH" => client.patch(&url),
            "HEAD" => client.head(&url),
            "OPTIONS" => client.request(reqwest::Method::OPTIONS, &url),
            _ => return Err(anyhow::anyhow!("Unsupported method: {}", method)),
        };

        // Add headers
        let mut har_headers = Vec::new();
        if let Some(headers) = &request.header {
            for header in headers {
                if header.disabled.unwrap_or(false) {
                    continue;
                }
                let value = self.resolve_variables(&header.value);
                req_builder = req_builder.header(&header.key, &value);
                har_headers.push(HarHeader {
                    name: header.key.clone(),
                    value,
                });
            }
        }

        // Add body
        let post_data = if let Some(body) = &request.body {
            match body.mode.as_str() {
                "raw" => {
                    if let Some(raw) = &body.raw {
                        let resolved_body = self.resolve_variables(raw);
                        req_builder = req_builder.body(resolved_body.clone());
                        Some(HarPostData {
                            mime_type: "application/json".to_string(),
                            text: resolved_body,
                        })
                    } else {
                        None
                    }
                }
                _ => None,
            }
        } else {
            None
        };

        // Execute request
        let response = req_builder.send().await?;

        let end_time = SystemTime::now();
        let duration = end_time.duration_since(start_time)?.as_millis() as f64;

        let status = response.status().as_u16();
        let status_text = response.status().canonical_reason().unwrap_or("").to_string();

        let mut response_headers = Vec::new();
        for (name, value) in response.headers() {
            response_headers.push(HarHeader {
                name: name.to_string(),
                value: value.to_str().unwrap_or("").to_string(),
            });
        }

        let content_type = response
            .headers()
            .get("content-type")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("application/octet-stream")
            .to_string();

        let body_text = response.text().await?;
        let body_size = body_text.len() as i32;

        Ok(HarEntry {
            started_date_time,
            time: duration,
            request: HarRequest {
                method,
                url: url.clone(),
                http_version: "HTTP/1.1".to_string(),
                headers: har_headers,
                query_string: Vec::new(),
                headers_size: -1,
                body_size: post_data.as_ref().map(|p| p.text.len() as i32).unwrap_or(0),
                post_data,
            },
            response: HarResponse {
                status,
                status_text,
                http_version: "HTTP/1.1".to_string(),
                headers: response_headers,
                content: HarContent {
                    size: body_size,
                    mime_type: content_type,
                    text: body_text,
                },
                redirect_url: String::new(),
                headers_size: -1,
                body_size,
            },
            cache: serde_json::json!({}),
            timings: HarTimings {
                send: 0.0,
                wait: duration,
                receive: 0.0,
            },
        })
    }

    fn resolve_url(&self, url: &Url) -> Result<String> {
        let url_str = match url {
            Url::String(s) => s.clone(),
            Url::Object(obj) => obj.raw.clone().unwrap_or_default(),
        };

        Ok(self.resolve_variables(&url_str))
    }

    fn resolve_variables(&self, text: &str) -> String {
        let mut result = text.to_string();

        // Replace {{variable}} with actual values
        for (key, value) in &self.variables {
            let placeholder = format!("{{{{{}}}}}", key);
            result = result.replace(&placeholder, value);
        }

        result
    }
}
