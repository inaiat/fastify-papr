import type { FastifyPluginAsync } from 'fastify'

import fp from 'fastify-plugin'
import type { IndexDescription } from 'mongodb'
import type { BaseSchema, SchemaOptions } from 'papr'
import { paprHelper } from './papr-helper.js'
import type { FastifyPapr, FastifyPaprOptions, ModelRegistration } from './types.js'

declare module 'fastify' {
  interface FastifyInstance {
    papr: FastifyPapr
  }
}

export const asCollection = <TSchema extends BaseSchema>(
  name: string,
  // eslint-disable-next-line functional/prefer-immutable-types
  schema: [TSchema, SchemaOptions<Partial<TSchema>>],
  // eslint-disable-next-line functional/prefer-immutable-types
  indexes?: IndexDescription[],
): ModelRegistration => ({
  name,
  schema,
  indexes,
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

        [dbName]: models,
      }
    } else {
      mutable_fastify.decorate('papr', {
        [dbName]: models,
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
