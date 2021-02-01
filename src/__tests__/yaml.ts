const fs = require('fs');
const yaml = require('js-yaml');

it('test', async () => {
  try {
    let fileContents = fs.readFileSync('./config.yaml', 'utf8');
    let data = yaml.loadAll(fileContents);
  
    console.log(data);
    expect(data).toHaveProperty('hedging');
  } catch (e) {
    console.log(e);
  }
})
