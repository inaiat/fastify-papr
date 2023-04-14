import fp from 'fastify-plugin'
import type {BaseSchema, Model, SchemaOptions} from 'papr'
import { IndexDescription } from 'mongodb'
import type {FastifyPaprOptions, PaprModels} from './types.js'
import {paprHelper} from './papr-helper.js'

export const asModel = <TSchema extends BaseSchema>(
  collectionName: string,
  // eslint-disable-next-line functional/prefer-immutable-types
  collectionSchema: [TSchema, SchemaOptions<Partial<TSchema>>],
) => ({
  collectionName,
  collectionSchema,
})

export const asIndexes = (collectionName: string, collectionIndexes: readonly IndexDescription[]) => ({collectionName, collectionIndexes})

const fastifyPaprPlugin = fp<FastifyPaprOptions>(
  async (mutable_fastify, options) => {
    const helper = paprHelper(mutable_fastify, options.db, options.disableSchemaReconciliation)
    const models = await helper.register(options.models, options.indexes)
    const {name} = options
    if (name) {
      if (!mutable_fastify.papr) {
        mutable_fastify.decorate('papr', models)
      }

      if (mutable_fastify.papr[name]) {
        throw new Error(`Connection name already registered: ${name}`)
      }

      mutable_fastify.papr[name] = models as Model<any, any> & PaprModels
    }

    if (!mutable_fastify.papr) {
      mutable_fastify.decorate('papr', models)
    }
  },
  {fastify: '4.x', name: 'fastify-papr-plugin'},
)

export default fastifyPaprPlugin
export {fastifyPaprPlugin}
export * from './types.js'
export * from './simple-doc-failed-validation.js'
