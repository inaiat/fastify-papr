# fastify-papr

A fastify Papr plugin integration.

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

declare module 'fastify' {
  interface PaprModels {
    user: Model<typeof userSchema[0], Partial<typeof userSchema[1]>>
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
```

How to use:
```ts
import { FastifyPluginAsync } from 'fastify'
import { Static, Type } from '@sinclair/typebox'

const userDto = Type.Object({
  name: Type.String({ maxLength: 100, minLength: 10 }),
  phone: Type.String({ maxLength: 20, minLength: 8 }),
})

const userRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ readonly Body: Static<typeof userDto> }>(
    '/user',
    {
      schema: {
        body: userDto,
      },
    },
    async (req) => {
      const result = await fastify.papr.user.insertOne(req.body)
      return result
    },
  )
}

export default userRoute
```

## Papr Documentation

Read the documentation at: [plexinc.github.io/papr](https://plexinc.github.io/papr/)