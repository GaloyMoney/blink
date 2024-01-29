use std::collections::HashMap;

// A utility function to generate the query string for multiple parameters
pub fn generate_query_string(params: &HashMap<&str, Option<impl ToString>>) -> String {
    let mut query_string = String::new();

    for (key, value_option) in params {
        if let Some(value) = value_option {
            if !query_string.is_empty() {
                query_string.push('&');
            }
            query_string.push_str(&format!("{}={}", key, value.to_string()));
        }
    }

    query_string
}
