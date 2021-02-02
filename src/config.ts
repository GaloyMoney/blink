const fs = require('fs');
const yaml = require('js-yaml');

let defaultContent = fs.readFileSync('./default.yaml', 'utf8');
export const defaultConfig = yaml.load(defaultContent)

let customContent = process.env.CONFIGYAML
export const customConfig = yaml.load(customContent)

console.log({defaultConfig, customContent, customConfig})

export const yamlConfig = { ... defaultConfig, ...customConfig }