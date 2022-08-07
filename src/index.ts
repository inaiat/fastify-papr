import fp from 'fastify-plugin'
import { BaseSchema, Model } from 'papr'
import { FastifyPaprOptions, PaprModels } from './types.js'
import { paprHelper } from './papr-helper.js'

export const asModel = <TSchema extends BaseSchema, TDefaults extends Partial<TSchema>>(
  collectionName: string,
  collectionSchema: [TSchema, TDefaults],
) => ({
  collectionName,
  collectionSchema,
})

const fastifyPaprPlugin = fp<FastifyPaprOptions>(
  async (fastify, options) => {
    const helper = paprHelper(fastify, options.db)
    const models = await helper.register(options.models)
    const name = options.name
    if (name) {
      if (!fastify.papr) {
        fastify.decorate('papr', models)
      }
      if (fastify.papr[name]) {
        throw new Error('Connection name already registered: ' + name)
      }
      fastify.papr[name] = models as Model<any, any> & PaprModels
    }
    if (!fastify.papr) {
      fastify.decorate('papr', models)
    }
  },
  { fastify: '4.x', name: 'fastify-papr-plugin' },
)

export default fastifyPaprPlugin
export { fastifyPaprPlugin }
export * from './types.js'
