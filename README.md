# fastify-papr

![Statements](https://img.shields.io/badge/statements-96.8%25-brightgreen.svg?style=flat) ![Branches](https://img.shields.io/badge/branches-94.02%25-brightgreen.svg?style=flat) ![Functions](https://img.shields.io/badge/functions-96.96%25-brightgreen.svg?style=flat) ![Lines](https://img.shields.io/badge/lines-96.66%25-brightgreen.svg?style=flat)

A fastify Papr plugin integration.

This package is distributed as ESM-only.

## Tooling

This package uses `Vite+` for packaging, testing, formatting, and static checks while keeping `pnpm` scripts as the main interface:

```bash
pnpm build
pnpm test
pnpm lint
pnpm coverage
```

The published package ships a single ESM build plus declarations in `dist/`.

## Getting started

```bash
pnpm add @inaiat/fastify-papr @fastify/mongodb
```

Runtime requirement: Node.js `>=22.12.0`.

## Breaking Changes in v12.0.0

- The package is now distributed as ESM-only.
- The CommonJS bundle (`dist/index.cjs`) is no longer published.
- The minimum supported Node.js version is now `22.12.0`.

### Migration Guide

- Prefer ESM imports:

```ts
import fastifyPaprPlugin, { asCollection } from '@inaiat/fastify-papr'
```

- If you still consume it from CommonJS on modern Node.js, load the ESM default export explicitly:

```js
const { default: fastifyPaprPlugin, asCollection } = require('@inaiat/fastify-papr')
```

Next, set up the plugin:

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

How to use:

```ts
import { FastifyPluginAsync } from 'fastify'
import { Static, Type } from '@sinclair/typebox'
import { MongoServerError } from 'mongodb'
import { MongoValidationError, isMongoServerError } from '@inaiat/fastify-papr'

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
    async (req, reply) => {
      try {
        const result = await fastify.papr.user.insertOne(req.body)
        return result
      } catch (error) {
        // Check if it's a MongoDB validation error
        if (isMongoServerError(error) && error.code === 121) {
          const validationError = new MongoValidationError(error)

          // Log or process the validation details
          console.error('Validation failed:', validationError.getValidationErrorsAsString())

          // Example: Get errors for a specific field
          const nameErrors = validationError.getFieldErrors('name')
          if (nameErrors) {
            console.error('Name field errors:', nameErrors)
          }

          // Return a 400 Bad Request with validation details
          return reply.status(400).send({
            message: 'Validation failed',
            errors: validationError.validationErrors,
          })
        }

        // Handle other errors
        fastify.log.error(error)
        return reply.status(500).send({ message: 'Internal Server Error' })
      }
    },
  )
}

export default userRoute
```

## Breaking Changes in v9.0.0

### MongoDB Validation Error Handling

We've consolidated and improved the MongoDB validation error handling in v2.0.0:

- The `SimpleDocFailedValidationError` and related types have been replaced with a new `MongoValidationError` class
- The error extraction logic has been improved for better type safety and reliability
- New helper methods have been added for easier access to validation errors

#### Migration Guide

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

New features:

```typescript
// Get validation errors for a specific field
const nameErrors = validationError.getFieldErrors('name')
```

Type changes:

```diff
- DocumentFailedValidation → DocumentValidationError
- PropertiesNotSatisfied → ValidationProperty
- PropertyDetail → ValidationDetail
- SimpleDocFailedValidation → ValidationErrors
```

## Papr Documentation and examples

To learn more about the code and see additional examples, you can visit the Papr documentation at [plexinc.github.io/papr](https://plexinc.github.io/papr/) and explore test folder on this project.
