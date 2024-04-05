use handlebars::Handlebars;
use serde_json::json;

pub struct EmailFormatter<'a> {
    handlebars: Handlebars<'a>,
}

impl EmailFormatter<'_> {
    pub fn new() -> Self {
        let mut handlebars = Handlebars::new();
        handlebars
            .register_template_string(
                "general",
                include_str!(concat!(
                    env!("CARGO_MANIFEST_DIR"),
                    "/templates/general.hbs"
                )),
            )
            .expect("general template failed to register");
        handlebars
            .register_template_string(
                "base",
                include_str!(concat!(
                    env!("CARGO_MANIFEST_DIR"),
                    "/templates/layouts/base.hbs"
                )),
            )
            .expect("base template failed to register");
        handlebars
            .register_template_string(
                "styles",
                include_str!(concat!(
                    env!("CARGO_MANIFEST_DIR"),
                    "/templates/partials/styles.hbs"
                )),
            )
            .expect("styles failed to register");

        EmailFormatter { handlebars }
    }

    pub fn generic_email_template(&self, subject: &str, body: &str) -> String {
        let data = json!({
            "subject": subject,
            "body": body,
        });
        self.handlebars
            .render("general", &data)
            .expect("unable to render email template")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generic_email_template() -> anyhow::Result<()> {
        let email_formatter = EmailFormatter::new();
        let title = "title";
        let body = "body";
        email_formatter.generic_email_template(title, body);
        Ok(())
    }
}
