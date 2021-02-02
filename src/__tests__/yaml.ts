import { defaultConfig, customConfig } from "../config";


it('test', async () => {
  try {  
    console.log(defaultConfig);
    expect(defaultConfig).toHaveProperty('hedging');
    expect(defaultConfig).toHaveProperty('name');

    console.log(customConfig);
    expect(customConfig).toHaveProperty('name');
  } catch (e) {
    console.log(e);
  }
})
