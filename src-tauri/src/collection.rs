use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct PostmanCollection {
    pub info: CollectionInfo,
    pub item: Vec<Item>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variable: Option<Vec<Variable>>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CollectionInfo {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schema: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(untagged)]
pub enum Item {
    Request(RequestItem),
    Folder(FolderItem),
}

#[derive(Debug, Deserialize, Serialize)]
pub struct RequestItem {
    pub name: String,
    pub request: Request,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub response: Option<Vec<serde_json::Value>>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct FolderItem {
    pub name: String,
    pub item: Vec<Item>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(untagged)]
pub enum Request {
    Simple(String),
    Full(FullRequest),
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct FullRequest {
    pub method: String,
    pub url: Url,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub header: Option<Vec<Header>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<Body>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auth: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(untagged)]
pub enum Url {
    String(String),
    Object(UrlObject),
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct UrlObject {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub protocol: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub host: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub query: Option<Vec<QueryParam>>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Header {
    pub key: String,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disabled: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct QueryParam {
    pub key: String,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disabled: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Body {
    pub mode: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub urlencoded: Option<Vec<KeyValue>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub formdata: Option<Vec<KeyValue>>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct KeyValue {
    pub key: String,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disabled: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Variable {
    pub key: String,
    pub value: String,
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub var_type: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Environment {
    pub name: String,
    pub values: Vec<Variable>,
}

impl PostmanCollection {
    pub fn get_all_requests(&self) -> Vec<&RequestItem> {
        let mut requests = Vec::new();
        self.collect_requests(&self.item, &mut requests);
        requests
    }

    fn collect_requests<'a>(&self, items: &'a [Item], requests: &mut Vec<&'a RequestItem>) {
        for item in items {
            match item {
                Item::Request(req) => requests.push(req),
                Item::Folder(folder) => self.collect_requests(&folder.item, requests),
            }
        }
    }
}
