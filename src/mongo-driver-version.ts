import mongodbPackageJson from 'mongodb/package.json' with { type: 'json' }

const MIN_MONGODB_DRIVER_MAJOR = 7
const { version: detectedMongoDbVersion } = mongodbPackageJson

export const ensureMongoDriverVersion = (version = detectedMongoDbVersion) => {
  if (Number.parseInt(version, 10) >= MIN_MONGODB_DRIVER_MAJOR) {
    return
  }

  throw new Error(
    `@inaiat/fastify-papr requires mongodb driver >=${MIN_MONGODB_DRIVER_MAJOR}. Detected ${version || 'unknown'}.`,
  )
}

export const getDetectedMongoDriverVersion = () => detectedMongoDbVersion
