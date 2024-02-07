import { submitMerchantSuggest } from "@/app/server-acton"
import InputComponent from "../input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../sheet"
import { useFormState } from "react-dom"
import { useState } from "react"

type formProps = {
  latitude: number
  longitude: number
}

export function SuggestMapFormSheet({ latitude, longitude }: formProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction] = useFormState<
    {
      error: boolean
      message: string
    },
    FormData
  >(submitMerchantSuggest, {
    error: false,
    message: "",
  })

  const handleOpen = () => {
    state.error = false
    state.message = ""
    setIsOpen(true)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="bg-orange-500 p-1 text-white rounded-md" onClick={handleOpen}>
          Confirm
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Suggest Business</SheetTitle>
        </SheetHeader>
        {state.message === "success" ? (
          <p className="text-center p-4 pt-10">{"Request Submitted"}</p>
        ) : (
          <>
            <SheetDescription>
              Fill the Details of the Business you want to suggest, with there username.
            </SheetDescription>
            <form action={formAction} className="grid g py-4">
              <InputComponent
                required={true}
                label="Business Title"
                id="business-title"
                placeholder="Business Title"
                name="title"
              />
              <InputComponent
                required={true}
                label="username"
                id="username"
                placeholder="username"
                name="username"
              />
              <InputComponent
                required={true}
                label="Latitude"
                id="latitude"
                value={latitude}
                placeholder="Latitude"
                name="latitude"
                type="number"
              />
              <InputComponent
                required={true}
                label="Longitude"
                id="longitude"
                value={longitude}
                placeholder="Longitude"
                name="longitude"
                type="number"
              />
              {state.error && <span className="text-red-600">{state.message}</span>}
              <button
                className="mt-2 bg-orange-500 p-2 text-white rounded-lg"
                type="submit"
              >
                Suggest
              </button>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
