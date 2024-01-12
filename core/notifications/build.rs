fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("cargo:rerun-if-changed=migrations");

    // std::env::set_var("PROTOC", protobuf_src::protoc());
    tonic_build::configure().compile(&["proto/notifications.proto"], &["proto"])?;
    Ok(())
}
