import type { FastifyInstance } from 'fastify'
import type { Db, IndexDescription } from 'mongodb'
import type { BaseSchema, SchemaOptions } from 'papr'
import Papr, { type Model } from 'papr'
import type { ModelRegistrationPair } from './types.js'
import { type FastifyPapr } from './types.js'

export const paprHelper = (fastify: Readonly<FastifyInstance>, db: Db, disableSchemaReconciliation = false) => {
  const papr = new Papr()
  papr.initialize(db)

  const registerModel = async <TSchema extends BaseSchema, TOptions extends SchemaOptions<TSchema>>(
    collectionName: string,
    // eslint-disable-next-line functional/prefer-immutable-types
    collectionSchema: [TSchema, TOptions],
  ) => {
    const model = papr.model(collectionName, collectionSchema)

    if (!disableSchemaReconciliation) {
      await papr.updateSchema(model)
    }

    return model
  }

  const registerIndexes = async (collectionName: string, indexes: readonly IndexDescription[]) =>
    db.collection(collectionName).createIndexes(indexes as IndexDescription[])

  return {
    async register(models: ModelRegistrationPair<FastifyPapr>): Promise<FastifyPapr> {
      return Object.fromEntries(
        await Promise.all(
          Object.entries(models).map(async ([name, paprModel]) => {
            const model = await registerModel(paprModel.collectionName, paprModel.collectionSchema)
            fastify.log.info(`Model ${name} decorated`)
            if (paprModel.collectionIndexes) {
              const index = await registerIndexes(paprModel.collectionName, paprModel.collectionIndexes)
              fastify.log.info(`Indexes for ${paprModel.collectionName} => ${index.join(', ')} created.`)
            }

            return [name, model] as [string, Model<BaseSchema, SchemaOptions<Partial<BaseSchema>>>]
          }),
        ),
      )
    },
  }
}
