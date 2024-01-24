// import axios from "axios"
// // import MockAdapter from "axios-mock-adapter"
// import Ibex from "@services/IbexHelper"

// // let mock

// // beforeAll(() => {
// //   mock = new MockAdapter(axios)
// // })

// // afterEach(() => {
// //   mock.reset()
// // })


// // mocked Ibex call
// function callIbex401(): Promise<any> {
//     return new Promise((resolve, reject) => {
//         // Simulating a 401 error
//         setTimeout(() => {
//             reject({ status: 401, message: 'Unauthorized' });
//         }, 1000);
//     });
// }

// function callIbexSuccess(): Promise<any> {
//     return new Promise((resolve, reject) => {
//         resolve("data")
//     });
// }

// describe("authentication flow", () => {
//   it("returns proxy false when proxy is no", async () => {

//     withAuth(callIbex401)

//     const ipInfo = await IpFetcher().fetchIPInfo(ip)
//     expect(ipInfo).toEqual(
//       expect.objectContaining({
//         proxy: false,
//         status: "ok",
//       }),
//     )
//   })
// })
