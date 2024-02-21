use handlebars::Handlebars;
use serde_json::json;

pub struct EmailFormatter<'a> {
    handlebars: Handlebars<'a>,
}

impl EmailFormatter<'_> {
    pub fn new() -> Self {
        let mut handlebars = Handlebars::new();
        // add error handling
        handlebars
            .register_template_file("identification", "./templates/identification.hbs")
            .expect("Template should be present");
        handlebars
            .register_template_file("base", "./templates/layouts/base.hbs")
            .expect("Template should be present");
        handlebars
            .register_template_file("styles", "./templates/partials/styles.hbs")
            .expect("Template should be present");

        // add error handling
        EmailFormatter { handlebars }
    }

    pub fn generic_email_template(&self, subject: &str, body: &str) -> String {
        let data = json!({
            "subject": subject,
            "body": body,
        });
        self.handlebars
            .render("identification", &data)
            .expect("Template should be present")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generic_email_template() {
        let email_formatter = EmailFormatter::new();
        let title = "title";
        let body = "body";
        email_formatter.generic_email_template(title, body);
    }
}
