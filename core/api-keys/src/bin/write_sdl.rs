use async_graphql::SDLExportOptions;

fn main() {
    println!(
        "{}",
        lib_api_keys::graphql::schema(None)
            .sdl_with_options(SDLExportOptions::new().federation())
            .trim()
    );
}
