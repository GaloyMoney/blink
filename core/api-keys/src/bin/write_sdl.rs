fn main() {
    println!("{}", lib_api_keys::graphql::schema().sdl().trim());
}
