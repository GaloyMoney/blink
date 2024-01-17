#[derive(Clone, Default, Debug)]
pub struct UserNotificationSettings {
    push: UserNotificationChannelSettings,
}

#[derive(Clone, Debug)]
pub struct UserNotificationChannelSettings {
    enabled: bool,
    disabled_categories: Vec<String>,
}

impl Default for UserNotificationChannelSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            disabled_categories: Vec::new(),
        }
    }
}
