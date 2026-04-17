import { doesNotThrow, throws } from 'node:assert/strict'
import { describe, it } from 'vite-plus/test'

import { ensureMongoDriverVersion, getDetectedMongoDriverVersion } from '../src/mongo-driver-version.js'

describe('mongo driver version check', () => {
  it('accepts supported versions', () => {
    doesNotThrow(() => {
      ensureMongoDriverVersion('8.2.5')
    })
    doesNotThrow(() => {
      ensureMongoDriverVersion('7.0.30')
    })
    doesNotThrow(() => {
      ensureMongoDriverVersion(getDetectedMongoDriverVersion())
    })
  })

  it('rejects unsupported or invalid versions', () => {
    const message = /requires mongodb driver >=7/i

    throws(() => {
      ensureMongoDriverVersion('6.9.9')
    }, message)
    throws(() => {
      ensureMongoDriverVersion('')
    }, message)
    throws(() => {
      ensureMongoDriverVersion('invalid')
    }, message)
  })
})
