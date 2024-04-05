use async_graphql::SDLExportOptions;

fn main() {
    println!(
        "{}",
        lib_notifications::graphql::schema(None)
            .sdl_with_options(SDLExportOptions::new().federation())
            .trim()
    );
}
