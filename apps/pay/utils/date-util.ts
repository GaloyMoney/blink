const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export function formattedDate(date: Date) {
  return date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear()
}

export function formattedTime(date: Date) {
  return (
    date.getHours() + ":" + date.getMinutes() + " " + (date.getHours() > 12 ? "pm" : "am")
  )
}
