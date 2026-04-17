# Integration Patterns

## Runtime and packaging constraints

- The package is ESM-only.
- The supported runtime floor is Node.js `22.12.0`.
- The plugin expects a MongoDB `Db` instance, not just a connection string.
- Register `@fastify/mongodb` before `@inaiat/fastify-papr`.

Minimal import shape:

```ts
import fastifyMongodb from '@fastify/mongodb'
import fastifyPaprPlugin, { asCollection } from '@inaiat/fastify-papr'
```

## Default single-database registration

Use this when the service has one logical MongoDB connection and you want direct access such as `fastify.papr.user`.

```ts
import fp from 'fastify-plugin'
import fastifyMongodb from '@fastify/mongodb'
import fastifyPaprPlugin, { asCollection, type FastifyPaprOptions } from '@inaiat/fastify-papr'
import { schema, types } from 'papr'

const userSchema = schema({
  name: types.string({ required: true, minLength: 3, maxLength: 100 }),
})

export default fp<FastifyPaprOptions>(async (fastify) => {
  await fastify.register(fastifyMongodb, {
    url: 'mongodb://localhost:27017',
  })

  await fastify.register(fastifyPaprPlugin, {
    db: fastify.mongo.client.db('app'),
    models: {
      user: asCollection('user', userSchema),
    },
  })
})
```

## Multiple database registration

Use `options.name` when models must live under separate logical connections.

```ts
await fastify.register(fastifyPaprPlugin, {
  name: 'db1',
  db: fastify.mongo.client.db('db1'),
  models: {
    user: asCollection('user', userSchema),
  },
})

await fastify.register(fastifyPaprPlugin, {
  name: 'db2',
  db: fastify.mongo.client.db('db2'),
  models: {
    order: asCollection('order', orderSchema),
  },
})

const user = await fastify.papr.db1?.user.find({})
const order = await fastify.papr.db2?.order.find({})
```

Best practices:

- Do not reuse the same connection name twice. The plugin throws on duplicates.
- Avoid mixing unnamed and named registrations in the same app. Pick one access pattern and keep it consistent.
- Keep the Fastify property names stable and map them intentionally to MongoDB collection names.

## Collection naming and indexes

The first argument to `asCollection` is the MongoDB collection name. The object key in `models` is the property name exposed on `fastify.papr`.

```ts
models: {
  user: asCollection('users', userSchema, [{ key: { email: 1 }, unique: true }]),
}
```

That example produces `fastify.papr.user`, backed by the MongoDB collection `users`.

Best practices:

- Use singular or plural names consistently across the app.
- Put index definitions next to the schema registration so the collection contract is reviewable in one place.
- Keep the `models` keys descriptive; they become part of the consumer-facing application API.

## Schema reconciliation

By default, the plugin calls Papr schema reconciliation during registration. Only disable it when schema management is handled elsewhere and you are sure the runtime should not attempt to update collection validation.

```ts
await fastify.register(fastifyPaprPlugin, {
  db,
  disableSchemaReconciliation: true,
  models,
})
```

Prefer leaving reconciliation enabled unless there is a concrete operational reason to skip it.
