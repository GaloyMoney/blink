use std::ffi::OsString;

fn get_env(key: &str) -> Option<OsString> {
    println!("cargo:rerun-if-env-changed={}", key);
    std::env::var_os(key)
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("cargo:rerun-if-changed=migrations");

    let mut tonic = tonic_build::configure();
    if get_env("OUT_DIR").is_none() {
        if let Some(out) = get_env("OUT") {
            tonic = tonic.out_dir(out);
        }
    }
    tonic.compile(&["proto/notifications.proto"], &["proto"])?;
    Ok(())
}
