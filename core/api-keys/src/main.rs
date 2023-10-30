use tokio::task;

#[tokio::main]
async fn main() {
    task::spawn(async {
        println!("Hello, world!");
    })
    .await
    .unwrap();
}
