/**
 * how to run:
 *
 * yarn ts-node --files -r tsconfig-paths/register src/debug/clean-kratos-identities.ts
 *
 */

import { CouldNotFindAccountFromKratosIdError } from "@/domain/errors"
import { IdentityRepository } from "@/services/kratos"
import { setupMongoConnection } from "@/services/mongodb"
import { AccountsRepository } from "@/services/mongoose"

const main = async () => {
  const identityRepo = IdentityRepository()
  const identities = identityRepo.listIdentities()
  const identitiesToDelete: AnyIdentity[] = []
  let processedIdentitiesCount = 0

  for await (const identity of identities) {
    if (identity instanceof Error) {
      throw identity
    }

    const account = await AccountsRepository().findByUserId(identity.id)
    if (account instanceof CouldNotFindAccountFromKratosIdError) {
      // we can't delete here because affects list identities pagination
      identitiesToDelete.push(identity)
    }

    processedIdentitiesCount++
    if (processedIdentitiesCount % 1000 === 0) {
      console.log(`Processed ${processedIdentitiesCount} identities`)
    }
  }

  console.log(`Processed ${processedIdentitiesCount} identities`)
  console.log(`Identities to delete ${identitiesToDelete.length}`)

  let identitiesDeleted = 0
  for (const { id, phone, email } of identitiesToDelete) {
    console.log(`Deleting identity ${id}`, { phone, email })
    const result = await identityRepo.deleteIdentity(id)
    if (result instanceof Error) {
      console.error(`Error deleting identity ${id}`, { phone, email })
      continue
    }
    identitiesDeleted++
  }

  console.log(`Identities deleted ${identitiesDeleted}`)
}

setupMongoConnection()
  .then(async (mongoose) => {
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
