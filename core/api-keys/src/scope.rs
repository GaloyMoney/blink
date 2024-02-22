pub const READ_SCOPE: &str = "read";
pub const WRITE_SCOPE: &str = "write";

pub fn read_only_scope() -> String {
    READ_SCOPE.to_string()
}

pub fn read_write_scope() -> String {
    format!("{READ_SCOPE} {WRITE_SCOPE}")
}

pub fn is_read_only(scope: &String) -> bool {
    !(scope.as_str().split(' ').any(|s| s == WRITE_SCOPE) || scope.is_empty())
}
