import type {FastifyInstance} from 'fastify'
import type {Db} from 'mongodb'
import Papr, {type Model} from 'papr'
import type {BaseSchema, SchemaOptions} from 'papr'
import {type PaprModels} from './types.js'
import type {ModelRegistrationPair} from './types.js'

export const paprHelper = (fastify: FastifyInstance, db: Db, disableSchemaReconciliation = false) => {
  const papr = new Papr()
  papr.initialize(db)

  const registerModel = async <TSchema extends BaseSchema, TOptions extends SchemaOptions<TSchema>>(
    collectionName: string,
    collectionSchema: [TSchema, TOptions],
  ) => {
    const model = papr.model(collectionName, collectionSchema)

    if (!disableSchemaReconciliation) {
      await papr.updateSchema(model)
    }

    return model
  }

  return {
    register: async (schemas: ModelRegistrationPair<PaprModels>): Promise<PaprModels> =>
      Object.fromEntries(await Promise.all(
        Object.entries(schemas).map(async ([modelName, modelObject]) => {
          const model = await registerModel(modelObject.collectionName, modelObject.collectionSchema)
          fastify.log.info(`Model ${modelName} decorated`)
          return [modelName, model] as [string, Model<BaseSchema, SchemaOptions<Partial<BaseSchema>>>]
        }))),

  }
}
