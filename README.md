# fastify-papr

![Statements](https://img.shields.io/badge/statements-96.8%25-brightgreen.svg?style=flat) ![Branches](https://img.shields.io/badge/branches-94.02%25-brightgreen.svg?style=flat) ![Functions](https://img.shields.io/badge/functions-96.96%25-brightgreen.svg?style=flat) ![Lines](https://img.shields.io/badge/lines-96.66%25-brightgreen.svg?style=flat)

**Type-safe MongoDB for Fastify.** A first-class [Papr](https://plexinc.github.io/papr/) integration that turns your schemas into fully typed collections, decorated right onto your Fastify instance — no boilerplate, no `any`, no runtime surprises.

```ts
const user = await fastify.papr.user.insertOne(req.body) // fully typed, validated, ready
```

## Why fastify-papr?

- **End-to-end type safety** — Papr schemas become TypeScript types automatically. Your routes, queries, and inserts are checked at compile time.
- **MongoDB-native validation** — Schemas compile to native MongoDB `$jsonSchema` validators, so invalid data is rejected at the database layer, not just in application code.
- **First-class error handling** — `MongoValidationError` parses MongoDB's cryptic validation errors into structured, field-level details you can return to clients.
- **Zero-ceremony DI** — Register models once with `asCollection(...)`, access them anywhere via `fastify.papr.<model>`.
- **Modern by default** — ESM-only, Node.js `>=22.12.0`, built on top of `@fastify/mongodb`.

## Install

```bash
pnpm add @inaiat/fastify-papr @fastify/mongodb
```

## Quick start

Define a schema, register the plugin, and you're done:

```ts
import fastifyMongodb from '@fastify/mongodb'
import fastifyPaprPlugin, { asCollection, type FastifyPaprOptions, type PaprModel } from '@inaiat/fastify-papr'
import fp from 'fastify-plugin'
import { schema, types } from 'papr'

const userSchema = schema({
  name: types.string({ required: true, minLength: 10, maxLength: 100 }),
  phone: types.string({ required: true, minLength: 8, maxLength: 20 }),
})

const userIndexes = [{ key: { name: 1 } }]

type UserModel = PaprModel<typeof userSchema>

declare module '@inaiat/fastify-papr' {
  interface FastifyPapr {
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
      models: {
        user: asCollection('user', userSchema, userIndexes),
      },
    })
  },
  { name: 'papr' },
)
```

## Using your models

Access fully typed collections anywhere through `fastify.papr`:

```ts
import { FastifyPluginAsync } from 'fastify'
import { Static, Type } from '@sinclair/typebox'
import { extractValidationErrors, isMongoServerError } from '@inaiat/fastify-papr'

const userDto = Type.Object({
  name: Type.String({ maxLength: 100, minLength: 10 }),
  phone: Type.String({ maxLength: 20, minLength: 8 }),
})

const userRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ readonly Body: Static<typeof userDto> }>(
    '/user',
    { schema: { body: userDto } },
    async (req, reply) => {
      try {
        return await fastify.papr.user.insertOne(req.body)
      } catch (error) {
        if (isMongoServerError(error) && error.code === 121) {
          const details = extractValidationErrors(error)
          if (details) {
            fastify.log.error({ details }, 'validation failed')
            return reply.status(400).send({ message: 'Validation failed', errors: details })
          }
        }

        fastify.log.error(error)
        return reply.status(500).send({ message: 'Internal Server Error' })
      }
    },
  )
}

export default userRoute
```

If you need field-level inspection after the MongoDB validation guard, wrap the error in `MongoValidationError` and use helpers like `getFieldErrors('name')`.

## Learn more

- [Papr documentation](https://plexinc.github.io/papr/) — schema options, operators, and advanced queries
- Explore the `tests/` folder in this repo for runnable examples

---

## Requirements

- Node.js `>=22.12.0`
- MongoDB server (any version supported by the official driver)
- ESM — this package is published as ESM-only

## Breaking changes in v12.0.0

- The package is now distributed as ESM-only.
- The CommonJS bundle (`dist/index.cjs`) is no longer published.
- The minimum supported Node.js version is now `22.12.0`.

### Migration

Prefer ESM imports:

```ts
import fastifyPaprPlugin, { asCollection } from '@inaiat/fastify-papr'
```

If you still consume it from CommonJS on modern Node.js, load the ESM default export explicitly:

```js
const { default: fastifyPaprPlugin, asCollection } = require('@inaiat/fastify-papr')
```

## Breaking changes in v9.0.0

### MongoDB validation error handling

`SimpleDocFailedValidationError` was replaced with a consolidated `MongoValidationError` class with better type safety and new helper methods.

Replace imports:

```diff
- import { SimpleDocFailedValidationError, tryExtractSimpleDocFailedValidation } from '@inaiat/fastify-papr'
+ import { MongoValidationError, extractValidationErrors } from '@inaiat/fastify-papr'
```

Use the new class and methods:

```diff
- const simpleError = new SimpleDocFailedValidationError(error)
- const hasErrors = simpleError.documentFailedValidation
- const errorDetails = simpleError.schemaRulesNotSatisfied
- const errorJson = simpleError.schemaRulesNotSatisfiedAsString()
+ const validationError = new MongoValidationError(error)
+ const hasErrors = validationError.hasValidationFailures
+ const errorDetails = validationError.validationErrors
+ const errorJson = validationError.getValidationErrorsAsString()
```

New: get validation errors for a specific field:

```ts
const nameErrors = validationError.getFieldErrors('name')
```

Type renames:

```diff
- DocumentFailedValidation → DocumentValidationError
- PropertiesNotSatisfied → ValidationProperty
- PropertyDetail → ValidationDetail
- SimpleDocFailedValidation → ValidationErrors
```

## Development

This package uses `Vite+` for packaging, testing, formatting, and static checks. `pnpm` scripts are the main interface:

```bash
pnpm build
pnpm test
pnpm lint
pnpm coverage
```

The published package ships a single ESM build plus declarations in `dist/`.
