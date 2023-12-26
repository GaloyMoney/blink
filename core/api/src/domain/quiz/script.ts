// pnpm tsx src/domain/earn/script.ts
/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-nocheck

import en from "../../../../../../galoy-mobile/app/i18n/en/index"

const earnSection = en.EarnScreen.earnSections

const transformedJson = Object.keys(earnSection).map((section) => {
  return {
    section: section,
    quiz: Object.keys(earnSection[section].questions),
  }
})

console.log(JSON.stringify(transformedJson, null, 2))
