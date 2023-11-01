use thiserror::Error;

#[derive(Error, Debug)]
pub enum AdminClientError {
    #[error("AdminClientError - Reqwest: {0}")]
    Reqwest(#[from] reqwest::Error),
    #[error("GaloyClientError - GraphQLNested {{ message: {message:?}, path: {path:?} }}")]
    GraphQLNested {
        message: String,
        path: Option<Vec<Option<String>>>,
    },
}
