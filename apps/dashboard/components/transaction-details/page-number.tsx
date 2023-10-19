"use client"
import * as React from "react"
import Box from "@mui/joy/Box"
import Button from "@mui/joy/Button"
import { iconButtonClasses } from "@mui/joy/IconButton"
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight"
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft"
import { useRouter } from "next/navigation"
interface PageInfo {
  readonly __typename?: "PageInfo"
  readonly endCursor?: string | null
  readonly hasNextPage: boolean
  readonly hasPreviousPage: boolean
  readonly startCursor?: string | null
}

function PageNumber({ pageInfo }: { pageInfo?: PageInfo }) {
  const router = useRouter()
  if (!pageInfo) {
    return null
  }
  const endCursor = pageInfo.endCursor
  const hasNextPage = pageInfo.hasNextPage

  return (
    <Box
      className="Pagination-laptopUp"
      sx={{
        pt: 2,
        gap: 1,
        [`& .${iconButtonClasses.root}`]: { borderRadius: "50%" },
        display: "flex",
      }}
    >
      <Button
        size="sm"
        // disabled={!hasPreviousPage} //FIXME  for now until pagination fix
        variant="outlined"
        color="neutral"
        startDecorator={<KeyboardArrowLeftIcon />}
        onClick={() => {
          router.push(`/transactions`)
        }}
      >
        Previous
      </Button>

      <Button
        size="sm"
        disabled={!hasNextPage}
        variant="outlined"
        color="neutral"
        endDecorator={<KeyboardArrowRightIcon />}
        onClick={() => {
          router.push(`/transactions?cursor=${endCursor}&direction=next`)
        }}
      >
        Next
      </Button>
    </Box>
  )
}

export default PageNumber
