import { FastifyInstance } from 'fastify'
import { Db } from 'mongodb'
import Papr, { BaseSchema } from 'papr'
import { ModelRegistrationPair, PaprModels } from './types.js'

export const paprHelper = (fastify: FastifyInstance, db: Db) => {
  const papr = new Papr()
  papr.initialize(db)

  const registerModel = async <TSchema extends BaseSchema, TDefaults extends Partial<TSchema>>(
    collectionName: string,
    collectionSchema: [TSchema, TDefaults],
  ) => {
    const model = papr.model(collectionName, collectionSchema)
    await papr.updateSchemas()
    return model
  }

  return {
    register: async (schemas: ModelRegistrationPair<PaprModels>) => {
      const models: PaprModels = {}
      await Promise.all(
        Object.entries(schemas).map(async (v) => {
          const model = await registerModel(v[1].collectionName, v[1].collectionSchema)
          models[v[0]] = model
          fastify.log.info(`Model ${v[0]} decorated`)
          return model
        }),
      )
      return models
    },
  }
}
