use handlebars::Handlebars;
use serde_json::json;

use super::error::MessagesError;

pub struct EmailFormatter<'a> {
    handlebars: Handlebars<'a>,
}

impl EmailFormatter<'_> {
    pub fn init() -> Result<Self, MessagesError> {
        let mut handlebars = Handlebars::new();
        handlebars.register_template_string(
            "general",
            include_str!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/templates/general.hbs"
            )),
        )?;
        handlebars.register_template_string(
            "base",
            include_str!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/templates/layouts/base.hbs"
            )),
        )?;
        handlebars.register_template_string(
            "styles",
            include_str!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/templates/partials/styles.hbs"
            )),
        )?;

        Ok(EmailFormatter { handlebars })
    }

    pub fn generic_email_template(
        &self,
        subject: &str,
        body: &str,
    ) -> Result<String, MessagesError> {
        let data = json!({
            "subject": subject,
            "body": body,
        });
        Ok(self.handlebars.render("general", &data)?)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generic_email_template() -> anyhow::Result<()> {
        let email_formatter = EmailFormatter::init()?;
        let title = "title";
        let body = "body";
        email_formatter.generic_email_template(title, body)?;
        Ok(())
    }
}
