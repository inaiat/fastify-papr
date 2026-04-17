---
name: fastify-papr
description: Use when the task involves integrating `@inaiat/fastify-papr` into a Fastify service, registering Papr models, designing or reviewing `FastifyPapr` type augmentation, handling MongoDB schema validation errors, or applying this library's runtime and packaging constraints correctly.
---

# Fastify Papr

## Overview

Use this skill when working with `@inaiat/fastify-papr` as a consumer or when updating the library itself. It covers the stable usage patterns for setup, model registration, typing, multi-database access, and MongoDB validation error handling.

## Quick Rules

- Treat the package as ESM-only. Prefer `import fastifyPaprPlugin, { asCollection } from '@inaiat/fastify-papr'`.
- Assume Node.js `>=22.12.0` and MongoDB driver `>=7`.
- Register `@fastify/mongodb` before registering this plugin, and pass a concrete `Db` instance as `options.db`.
- Build model registrations with `asCollection(...)` instead of hand-writing objects.
- Prefer one access pattern per app: either direct models on `fastify.papr` or named connections such as `fastify.papr.db1`.
- In consumers, augment the public module path `'@inaiat/fastify-papr'`, not internal source files.
- For MongoDB schema validation failures, first narrow with `isMongoServerError(error) && error.code === 121`, then use `MongoValidationError`.

## Workflow

1. Confirm the integration shape.
   Use the default export as the Fastify plugin, register Mongo first, then register Papr models with `asCollection`.

2. Decide the model access pattern early.
   If the service only uses one database, prefer direct models such as `fastify.papr.user`. If it uses multiple databases, register each connection with `options.name` and access models through `fastify.papr.<connectionName>.<modelName>`.

3. Make types explicit.
   Derive model types from schemas with `PaprModel<typeof schema>`. When consumers need typed access through `fastify.papr`, add module augmentation for `FastifyPapr`.

4. Keep validation handling structured.
   Do not parse `errInfo` inline in route handlers. Wrap validation errors with `MongoValidationError`, log or return the structured `validationErrors`, and use `getFieldErrors` only when field-specific branching is necessary.

5. Preserve the public contract when changing the library.
   If exports, helper types, or validation helpers change, update the consumer-facing type tests and the README examples in the same change.

## References

- For setup, registration patterns, indexes, schema reconciliation, and multi-database guidance, read [references/integration.md](references/integration.md).
- For exported type helpers, augmentation patterns, and validation error handling, read [references/types-and-errors.md](references/types-and-errors.md).
