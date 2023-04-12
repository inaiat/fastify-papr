import type {FastifyInstance} from 'fastify'
import type {Db, IndexDescription} from 'mongodb'
import Papr, {type Model, BaseSchema, SchemaOptions} from 'papr'
import {type PaprModels, ModelRegistrationPair, IndexesRegistrationPair} from './types.js'

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

  const registerIndexes = async (collectionName: string, indexes: readonly IndexDescription[]) => db.collection(collectionName).createIndexes(indexes as IndexDescription[])

  return {
    async register(schemas: ModelRegistrationPair<PaprModels>, indexes: IndexesRegistrationPair[] = []): Promise<PaprModels> {
      indexes.map(async ({ collectionIndexes, collectionName}) => {
        const index = await registerIndexes(collectionName, collectionIndexes)
        fastify.log.info(`Indexes to ${collectionName} created`)
        return index
      })

      return Object.fromEntries(await Promise.all(
        Object.entries(schemas).map(async ([modelName, modelObject]) => {
          const model = await registerModel(modelObject.collectionName, modelObject.collectionSchema)
          fastify.log.info(`Model ${modelName} decorated`)
          return [modelName, model] as [string, Model<BaseSchema, SchemaOptions<Partial<BaseSchema>>>]
        }),
      ))
    },
  }
}
