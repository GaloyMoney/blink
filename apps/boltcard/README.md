## Getting Started

First, run the development server:

shell 1:

```bash
core/api % yarn install
core/api % make reset-deps
core/api % bats -t test/bats/ln-receive.bats
core/api % make start
```

shell 2:
```bash
apps/boltcard % bun install
apps/boltcard % make reset-deps
apps/boltcard % bun next
```

shell 3:
```bash
apps/boltcard % ngrok http 3000
```

update SERVER_URL in config.ts with Forwarding address

shell 4:
```bash
apps/boltcard % bats -t bats/e2e-test.bats
```

for burning the card, need to only do some of the bats tests. we can do that by exiting early
```diff
diff --git a/apps/boltcard/bats/e2e-test.bats b/apps/boltcard/bats/e2e-test.bats
index ad1822e54..5a36a3a87 100644
--- a/apps/boltcard/bats/e2e-test.bats
+++ b/apps/boltcard/bats/e2e-test.bats
@@ -24,6 +24,8 @@ random_phone() {
   [[ $(echo $CALLBACK_API_URL) != "null" ]] || exit 1
   [[ $(echo $CALLBACK_UI_URL) != "null" ]] || exit 1
   
+  exit 1
+
   # TODO: test CALLBACK_UI_URL
 
   # Making the follow-up curl request

```


Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
