// import { testData } from "../../support/test-config";

// describe("Account ID Test", () => {
//   it("Verification Test", () => {
//     const login_challenge = Cypress.env("login_challenge");
//     console.log("===========", login_challenge);

//     console.log(login_challenge);
//     if (!login_challenge) {
//       throw new Error("login_challenge does not found");
//     }
//     const cookieValue = JSON.stringify({
//       loginType: "Phone",
//       value: testData.PHONE_NUMBER,
//       remember: false,
//     });
//     cy.setCookie(login_challenge, cookieValue, { secure: true });

//     cy.visit(`/login/verification?login_challenge=${login_challenge}`);
 
//   });
// });
