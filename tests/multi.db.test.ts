import {Model, schema, types} from 'papr'
import test from 'ava'
import {MongoClient} from 'mongodb'
import fastifyPaprPlugin, {asModel} from '../src/index.js'
import {createMongoServer, getConfiguredTestServer} from './helpers/server.js'

const userSchema = schema({
	name: types.string({required: true, maxLength: 20}),
	phone: types.string({required: true, minimum: 14}),
	age: types.number({required: true, minimum: 18, maximum: 200}),
})

const orderSchema = schema({
	orderNumber: types.number({required: true}),
	description: types.string({required: true}),
	date: types.date({required: true}),
})

declare module 'fastify' {
	interface PaprModels {
		db1: {user: Model<typeof userSchema[0], typeof userSchema[1]>};
		db2: {order: Model<typeof orderSchema[0], typeof orderSchema[1]>};
	}
}

test('multiple databases', async t => {
	const {server: fastify} = getConfiguredTestServer()

	const server1 = await createMongoServer()
	const server2 = await createMongoServer()

	const client1 = await MongoClient.connect(server1.getUri())
	const client2 = await MongoClient.connect(server2.getUri())

	await fastify.register(fastifyPaprPlugin, {
		name: 'db1',
		db: client1.db(),
		models: {
			user: asModel('user', userSchema),
		},
	})

	await fastify.register(fastifyPaprPlugin, {
		name: 'db2',
		db: client2.db(),
		models: {
			order: asModel('order', orderSchema),
		},
	})

	const user = {name: 'Elizeu Drummond', age: 40, phone: '552124561234'}
	const result = await fastify.papr.db1.user.insertOne(user)

	t.deepEqual(await fastify.papr.db1.user.findById(result._id), {_id: result._id, ...user})

	const order = {orderNumber: 1234, description: 'notebook', date: new Date()}
	const orderResult = await fastify.papr.db2.order.insertOne(order)

	t.deepEqual(await fastify.papr.db2.order.findById(orderResult._id), {_id: orderResult._id, ...order})
})
