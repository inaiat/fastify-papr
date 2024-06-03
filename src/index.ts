import fp from 'fastify-plugin'
import { fastifyPaprPlugin } from './fastify-papr-plugin.js'
export { asCollection, fastifyPaprPlugin } from './fastify-papr-plugin.js'
export * from './simple-doc-failed-validation.js'
export * from './types.js'

export default fp(fastifyPaprPlugin, {
  name: 'fastify-papr-plugin',
  fastify: '4.x',
})
