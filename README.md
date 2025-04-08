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


