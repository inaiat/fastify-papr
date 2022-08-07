# fastify-papr

A fastify Papr plugin for fastify framework.

## Getting started

```bash
yarn add @inaiat/fastify-papr @fastify/mongodb
```

Next, set up the plugin:
```ts
import fastifyMongodb from '@fastify/mongodb'
import fastifyPaprPlugin, { asModel, FastifyPaprOptions } from ' @inaiat/fastify-papr'
import fp from 'fastify-plugin'
import { Model, schema, types } from 'papr'

const userSchema = schema({
  name: types.string({ required: true, minLength: 10, maxLength: 100 }),
  phone: types.string({ required: true, minLength: 8, maxLength: 20 }),
})

export type UserModel = Model<typeof userSchema[0], Partial<typeof userSchema[1]>>

declare module 'fastify' {
  interface PaprModels {
    user: UserModel
  }
}

export default fp<FastifyPaprOptions>(
  async (fastify) => {
    await fastify.register(fastifyMongodb, {
      url: 'mongodb://localhost:27017',
    })

    await fastify.register(fastifyPaprPlugin, {
      db: fastify.mongo.client.db('test'),
      models: { user: asModel('user', userSchema) },
    })
  },
  { name: 'papr' },
)

    
