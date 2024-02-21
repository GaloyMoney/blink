use thiserror::Error;

#[derive(Error, Debug)]
pub enum MessagesError {
    #[error("MessagesError - HandlebarsError: {0}")]
    TemplateError(#[from] handlebars::TemplateError),
    #[error("MessagesError - HandlebarsError: {0}")]
    RenderError(#[from] handlebars::RenderError),
}
