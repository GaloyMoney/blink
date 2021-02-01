import { yamlConfig } from "../config";


it('test', async () => {
  try {  
    console.log(yamlConfig);
    expect(yamlConfig).toHaveProperty('hedging');
  } catch (e) {
    console.log(e);
  }
})
