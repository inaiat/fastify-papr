import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import type { IndexDescription } from 'mongodb'
import type { BaseSchema, SchemaOptions } from 'papr'
import { paprHelper } from './papr-helper.js'
import type { ColModel, FastifyPaprOptions, PaprModelItem } from './types.js'

export const asCollection = <TSchema extends BaseSchema>(
  collectionName: string,
  // eslint-disable-next-line functional/prefer-immutable-types
  collectionSchema: [TSchema, SchemaOptions<Partial<TSchema>>],
  // eslint-disable-next-line functional/prefer-immutable-types
  collectionIndexes?: IndexDescription[],
): PaprModelItem => ({
  collectionName,
  collectionSchema,
  collectionIndexes,
})

/**
 * @deprecated Since version 4.0. Will be deleted in version 5.0. Use {@link asCollection} instead.
 */
export const asModel = <TSchema extends BaseSchema>(
  collectionName: string,
  // eslint-disable-next-line functional/prefer-immutable-types
  collectionSchema: [TSchema, SchemaOptions<Partial<TSchema>>],
): PaprModelItem => ({
  collectionName,
  collectionSchema,
})
export const fastifyPaprPlugin: FastifyPluginAsync<FastifyPaprOptions> = async (mutable_fastify, options) => {
  const helper = paprHelper(
    mutable_fastify,
    options.db,
    options.disableSchemaReconciliation,
  )

  const models = await helper.register(options.models)
  const { name: dbName } = options

  if (dbName) {
    if (mutable_fastify.papr) {
      if (mutable_fastify.papr[dbName]) {
        throw new Error(`Connection name already registered: ${dbName}`)
      }
      mutable_fastify.log.info(`Registering connection name: ${dbName}`)
      mutable_fastify.papr = {
        ...mutable_fastify.papr,

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [dbName]: models as unknown as ColModel<any, any>,
      }
    } else {
      mutable_fastify.decorate('papr', {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [dbName]: models as unknown as ColModel<any, any>,
      })
    }
  } else {
    if (mutable_fastify.papr) {
      const items = Object.keys(mutable_fastify.papr).join(', ')
      throw new Error(`Models already registered: ${items}`)
    } else {
      mutable_fastify.decorate('papr', models)
    }
  }
}

export default fp(fastifyPaprPlugin, {
  name: 'fastify-papr-plugin',
  fastify: '4.x',
})
export * from './simple-doc-failed-validation.js'
export * from './types.js'
