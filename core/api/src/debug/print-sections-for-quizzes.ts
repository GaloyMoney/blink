// this script generates the content saved to ./sections.ts
// it assumes:
// - galoy-mobile is the source of truth for the different sections
// - galoy-mobile is in the same root as galoy repo
// pnpm tsx src/debug/print-sections-for-quizzes.ts
/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-nocheck

import en from "../../../../../galoy-mobile/app/i18n/en/index"

const earnSection = en.EarnScreen.earnSections

const transformedJson = Object.keys(earnSection).map((section) => {
  return {
    section: section,
    quiz: Object.keys(earnSection[section].questions),
  }
})

console.log(JSON.stringify(transformedJson, null, 2))
