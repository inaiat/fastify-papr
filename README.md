# fastify-papr

![Statements](https://img.shields.io/badge/statements-100%25-brightgreen.svg?style=flat) ![Branches](https://img.shields.io/badge/branches-93.1%25-brightgreen.svg?style=flat) ![Functions](https://img.shields.io/badge/functions-100%25-brightgreen.svg?style=flat) ![Lines](https://img.shields.io/badge/lines-100%25-brightgreen.svg?style=flat)

A fastify Papr plugin integration.

## Getting started

```bash
yarn add @inaiat/fastify-papr @fastify/mongodb
```

Next, set up the plugin:

```ts
import fastifyMongodb from '@fastify/mongodb'
import fastifyPaprPlugin, { asCollection, FastifyPaprOptions } from ' @inaiat/fastify-papr'
import fp from 'fastify-plugin'
import { Model, schema, types } from 'papr'

const userSchema = schema({
  name: types.string({ required: true, minLength: 10, maxLength: 100 }),
  phone: types.string({ required: true, minLength: 8, maxLength: 20 }),
})

const userIndexes = [{ key: { name: 1 } }]

declare module '@inaiat/fastify-papr' {
  interface FastifyPapr {
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
      models: { 
        user: asCollection('user', userSchema, userIndexes) 
      },
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

## Papr Documentation and examples

To learn more about the code and see additional examples, you can visit the Papr documentation at [plexinc.github.io/papr](https://plexinc.github.io/papr/) and explore test folder on this project.


