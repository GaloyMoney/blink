export const testData = {
  AUTHORIZATION_URL: Cypress.env("AUTHORIZATION_URL"),
  PHONE_NUMBER: "+16505554350",
  VERIFICATION_CODE: "000000",
};


export function generateRandomEmail() {
  const chars = "abcdefghijklmnopqrstuvwxyz1234567890";
  const userLength = Math.floor(Math.random() * 10) + 1;
  const domainLength = Math.floor(Math.random() * 10) + 1;
  let user = "";
  let domain = "";

  for (let i = 0; i < userLength; i++) {
    user += chars.charAt(Math.floor(Math.random() * chars.length));
  }

 
  return `${user}@galoy.io`;
}