import fp from 'fastify-plugin'
import type {BaseSchema, Model, SchemaOptions} from 'papr'
import type {FastifyPaprOptions, PaprModels} from './types.js'
import {paprHelper} from './papr-helper.js'

export const asModel = <TSchema extends BaseSchema>(
	collectionName: string,
	collectionSchema: [TSchema, SchemaOptions<Partial<TSchema>>],
) => ({
	collectionName,
	collectionSchema,
})

const fastifyPaprPlugin = fp<FastifyPaprOptions>(
	async (fastify, options) => {
		const helper = paprHelper(fastify, options.db, options.disableSchemaReconciliation)
		const models = await helper.register(options.models)
		const {name} = options
		if (name) {
			if (!fastify.papr) {
				fastify.decorate('papr', models)
			}

			if (fastify.papr[name]) {
				throw new Error(`Connection name already registered: ${name}`)
			}

			fastify.papr[name] = models as Model<any, any> & PaprModels
		}

		if (!fastify.papr) {
			fastify.decorate('papr', models)
		}
	},
	{fastify: '4.x', name: 'fastify-papr-plugin'},
)

export default fastifyPaprPlugin
export {fastifyPaprPlugin}
export * from './types.js'
export * from './simple-doc-failed-validation.js'
