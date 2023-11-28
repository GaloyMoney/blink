declare module "use-react-screenshot" {
  type UseScreenshot = (options?: {
    type: "image/jpeg" | "image/png"
    quality: number
  }) => [string | null, (ref: HTMLDivElement | null) => void]
  declare const useScreenshot: UseScreenshot
  export { useScreenshot }
}
