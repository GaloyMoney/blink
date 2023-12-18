"use client"

import Card from "../components/card"
import MainContent from "../components/main-container"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <MainContent>
      <Card>
        <h1 className="text-center mb-4 text-xl font-bold">Something went wrong!</h1>
        <div className="flex justify-center flex-col md:flex-row w-1/2 gap-2 mx-auto">
          <button
            onClick={() => reset()}
            className="flex-1 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </Card>
    </MainContent>
  )
}
