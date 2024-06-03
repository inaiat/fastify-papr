import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import type { IndexDescription } from 'mongodb'
import type { BaseSchema, SchemaOptions } from 'papr'
import { paprHelper } from './papr-helper.js'
import type { FastifyPaprOptions, PaprModelItem } from './types.js'

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
  const { name } = options
  if (name) {
    if (mutable_fastify.paprDb) {
      if (mutable_fastify.paprDb[name]) {
        throw new Error(`Connection name already registered: ${name}`)
      }
      mutable_fastify.paprDb[name] = models
    } else {
      mutable_fastify.decorate('paprDb', {
        [name]: models,
      })
    }
  }

  if (!mutable_fastify.papr) {
    mutable_fastify.decorate('papr', models)
  }
}

export default fp(fastifyPaprPlugin, {
  name: 'fastify-papr-plugin',
  fastify: '4.x',
})
export * from './simple-doc-failed-validation.js'
export * from './types.js'
