import {Model, schema, types} from 'papr'
import test from 'ava'
import {MongoClient, MongoServerError} from 'mongodb'
import fastifyPaprPlugin, {asModel} from '../src/index.js'
import {createMongoServer, getConfiguredTestServer} from './helpers/server.js'

const userSchema = schema({
	name: types.string({required: true, maxLength: 20}),
	phone: types.string({required: true, minimum: 14}),
	age: types.number({required: true, minimum: 18, maximum: 200}),
})

const orderSchema = schema({
	orderNumber: types.number({required: true}),
	description: types.string({minLength: 5, required: true}),
	date: types.date({required: true}),
})

declare module 'fastify' {
	interface PaprModels {
		user: Model<typeof userSchema[0], typeof userSchema[1]>;
		order: Model<typeof orderSchema[0], typeof orderSchema[1]>;
	}
}

test('multiple collections insert and retrieve', async t => {
	const {server: fastify} = getConfiguredTestServer()

	const server = await createMongoServer()

	const client = await MongoClient.connect(server.getUri())

	await fastify.register(fastifyPaprPlugin, {
		name: 'db1',
		db: client.db(),
		models: {
			user: asModel('user', userSchema),
			order: asModel('order', orderSchema),
		},
	})

	const user = {name: 'Elizeu Drummond', age: 30, phone: '552124561234'}
	const result = await fastify.papr.user.insertOne(user)

	t.deepEqual(await fastify.papr.user.findById(result._id), {_id: result._id, ...user})

	const order = {orderNumber: 1234, description: 'notebook', date: new Date()}
	const orderResult = await fastify.papr.order.insertOne(order)

	t.deepEqual(await fastify.papr.order.findById(orderResult._id), {_id: orderResult._id, ...order})
})

test('validation failed with two col', async t => {
	const {server: fastify} = getConfiguredTestServer()

	const server = await createMongoServer()

	const client = await MongoClient.connect(server.getUri())

	await fastify.register(fastifyPaprPlugin, {
		name: 'db1',
		db: client.db(),
		models: {
			user: asModel('user', userSchema),
			order: asModel('order', orderSchema),
		},
	})

	const user = {name: 'Elizeu Drummond', age: 400, phone: '552124561234'}
	await t.throwsAsync(async () => fastify.papr.user.insertOne(user), {
		instanceOf: MongoServerError,
	})

	const order = {orderNumber: 1234, description: 'n', date: new Date()}
	await t.throwsAsync(async () => fastify.papr.order.insertOne(order), {
		instanceOf: MongoServerError,
	})
})
