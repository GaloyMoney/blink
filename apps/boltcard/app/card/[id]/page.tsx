export default function Home({ params }: { params: { id: string } }) {
  const { id } = params

  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1>cardId: {id}</h1>
    </main>
  )
}
