// import { CasbinService } from "@services/casbin"
// import { createMandatoryUsers, getUserIdByTestUserRef } from "test/helpers"
// import {
//   Role,
//   subjectIdFromUserId,
//   subjectIdFromRole,
//   AccountPermission,
//   WalletPermission,
//   GlobalAuthorizationScope,
//   resourceIdFromAccountId,
//   resourceIdFromWalletId,
//   scopeFromAccountId,
// } from "@domain/authorization"

// describe("CasbinService", () => {
//   beforeAll(async () => {
//     await createMandatoryUsers()
//   })
//   describe("Role SupportLevel1 (from default config)", () => {
//     it("can read account status", async () => {
//       const casbinService = await CasbinService()
//       const userIdA = await getUserIdByTestUserRef("A")
//       const accountId = "some-account" as AccountId

//       await casbinService.addRoleToSubject({
//         subjectId: subjectIdFromUserId(userIdA),
//         scope: GlobalAuthorizationScope,
//         role: Role.SupportLevel1,
//       })
//       let allowed = await casbinService.checkPermission({
//         subjectId: subjectIdFromUserId(userIdA),
//         resourceId: resourceIdFromAccountId(accountId),
//         permission: AccountPermission.StatusRead,
//       })
//       expect(allowed).toBe(true)

//       allowed = await casbinService.checkPermission({
//         subjectId: subjectIdFromUserId(userIdA),
//         resourceId: resourceIdFromAccountId(accountId),
//         permission: AccountPermission.StatusUpdate,
//       })
//       expect(allowed).toBe(false)
//     })
//   })
// })
