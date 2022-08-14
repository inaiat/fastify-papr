import {FastifyInstance} from 'fastify'
import {Db} from 'mongodb'
import Papr, {BaseSchema} from 'papr'
import {ModelRegistrationPair, PaprModels} from './types.js'

export const paprHelper = (fastify: FastifyInstance, db: Db) => {
	const papr = new Papr()
	papr.initialize(db)

	const registerModel = async <TSchema extends BaseSchema, TDefaults extends Partial<TSchema>>(
		collectionName: string,
		collectionSchema: [TSchema, TDefaults],
	) => {
		const model = papr.model(collectionName, collectionSchema)
		await papr.updateSchema(model)
		return model
	}

	return {
		async register(schemas: ModelRegistrationPair<PaprModels>) {
			const models: PaprModels = {}
			await Promise.all(
				Object.entries(schemas).map(async ([modelName, modelObject]) => {
					const model = await registerModel(modelObject.collectionName, modelObject.collectionSchema)
					models[modelName] = model
					fastify.log.info(`Model ${modelName} decorated`)
					return model
				}),
			)
			return models
		},
	}
}
