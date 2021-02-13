const fs = require('fs');
const yaml = require('js-yaml');

let defaultContent = fs.readFileSync('./default.yaml', 'utf8');
export const defaultConfig = yaml.load(defaultContent)

let customContent, customConfig

try {
  customContent = fs.readFileSync('/var/custom.yaml', 'utf8');
  customConfig = yaml.load(customContent)
} catch (err) {
  console.warn({err})
}

console.log({defaultConfig, customContent, customConfig})

export const yamlConfig = { ... defaultConfig, ...customConfig }