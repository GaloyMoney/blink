export const formatDate = (timestamp: number): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }
  return new Date(timestamp * 1000).toLocaleDateString(undefined, options)
}

export const getScopeText = (readOnly: boolean): string => {
  return readOnly ? "Read Only" : "Read and Write"
}
