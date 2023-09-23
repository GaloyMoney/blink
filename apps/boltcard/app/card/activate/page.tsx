import { serverApi } from "@/services/config"

export default async function ActivateCard({ params }: { params: { id: string } }) {
  const { id } = params

  const cardApi = `${serverApi}/card/id/${id}`
  const cardResult = await fetch(cardApi, { cache: "no-store" })
  const cardInfo = await cardResult.json()

  const transactionsApi = `${serverApi}/card/id/${id}/transactions`
  const transactionsResult = await fetch(transactionsApi)
  const transactionInfo = await transactionsResult.json()
}
