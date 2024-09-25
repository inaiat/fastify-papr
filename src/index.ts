export { asCollection, fastifyPaprPlugin } from './fastify-papr-plugin.js'

export type {
  DocumentFailedValidation,
  PropertiesNotSatisfied,
  PropertyDetail,
  SimpleDocFailedValidation,
} from './simple-doc-failed-validation.js'
export { SimpleDocFailedValidationError, tryExtractSimpleDocFailedValidation } from './simple-doc-failed-validation.js'

export type { FastifyPapr, FastifyPaprOptions, ModelRegistration, ModelRegistrationPair } from './types.js'

export { fastifyPaprPlugin as default } from './fastify-papr-plugin.js'
