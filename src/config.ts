const fs = require('fs');
const yaml = require('js-yaml');

let fileContents = fs.readFileSync('./config.yaml', 'utf8');
export const yamlConfig = yaml.load(fileContents)