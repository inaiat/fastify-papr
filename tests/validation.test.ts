import type {Model} from 'papr'
import {schema, types} from 'papr'
import {MongoServerError} from 'mongodb'
import fastifyPaprPlugin, {asModel} from '../src/index.js'
import {SimpleDocFailedValidationError} from '../src/simple-doc-failed-validation.js'
import {getConfiguredTestServer, test} from './helpers/server.js'

export const userSchema = schema({
	name: types.string({uniqueItems: true, required: true, maxLength: 20}),
	phone: types.string({required: true, minimum: 14}),
	age: types.number({required: true, minimum: 18, maximum: 200}),
})

declare module 'fastify' {
	interface PaprModels {
		user: Model<typeof userSchema[0], typeof userSchema[1]>;
	}
}

test('document failed with name and age', async t => {
	const {server: fastify} = getConfiguredTestServer()

	await fastify.register(fastifyPaprPlugin, {
		db: t.context.client.db(),
		models: {
			user: asModel('user', userSchema),
		},
	})

	const user = {name: 'Elizeu Drummond Giant Name', age: 1050, phone: '552124561234'}
	const error = await t.throwsAsync(async () => fastify.papr.user.insertOne(user), {
		instanceOf: MongoServerError,
	})

	const simpleError = new SimpleDocFailedValidationError(error as MongoServerError)

	t.is(
		simpleError.schemaRulesNotSatisfied
			?.shift()
			?.properties.find(p => Object.keys(p).shift() === 'age')
			?.age?.shift()?.consideredValue,
		1050,
	)
})

test('simple doc failed validation should result undefined when schema rules not satisfied', async t => {
	const {server: fastify} = getConfiguredTestServer()

	await fastify.register(fastifyPaprPlugin, {
		db: t.context.client.db(),
		models: {
			user: asModel('user', userSchema),
		},
	})

	const user = {name: 'Elizeu Drummond', age: 40, phone: '552124561234'}
	const result = await fastify.papr.user.insertOne(user)

	const error = await t.throwsAsync(async () => fastify.papr.user.insertOne({_id: result._id, ...user}), {
		instanceOf: MongoServerError,
	})

	const simpleError = new SimpleDocFailedValidationError(error as MongoServerError)

	t.is(simpleError.schemaRulesNotSatisfiedAsString(), undefined)

	t.deepEqual(await fastify.papr.user.findById(result._id), {_id: result._id, ...user})
})

const sample1 = {
	failingDocumentId: '62f2753c0ab71ababe3aec15',
	details: {
		operatorName: '$jsonSchema',
		schemaRulesNotSatisfied: [
			{
				operatorName: 'properties',
				propertiesNotSatisfied: [
					{
						propertyName: 'name',
						details: [
							{
								operatorName: 'maxLength',
								specifiedAs: {
									maxLength: 20,
								},
								reason: 'specified string length was not satisfied',
								consideredValue: 'Elizeu Drummond Giant Name',
							},
						],
					},
					{
						propertyName: 'age',
						details: [
							{
								operatorName: 'maximum',
								specifiedAs: {
									maximum: 200,
								},
								reason: 'comparison failed',
								consideredValue: 500,
							},
						],
					},
				],
			},
		],
	},
}

test('basic parser', async t => {
	const m = new MongoServerError({code: 121, errInfo: sample1})
	const simpleError = new SimpleDocFailedValidationError(m)
	t.is(simpleError.schemaRulesNotSatisfied?.length, 1)
})
