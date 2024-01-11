#[derive(Clone, Default, Debug)]
pub struct NotificationSettings {
    push: NotificationChannelSettings,
}

#[derive(Clone, Debug)]
pub struct NotificationChannelSettings {
    enabled: bool,
    disabled_categories: Vec<String>,
}

impl Default for NotificationChannelSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            disabled_categories: Vec::new(),
        }
    }
}
