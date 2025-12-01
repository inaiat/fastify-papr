import mongodbPackageJson from 'mongodb/package.json' with { type: 'json' }

const MIN_MONGODB_DRIVER_MAJOR = 7
const detectedMongoDbVersion = typeof mongodbPackageJson.version === 'string' ? mongodbPackageJson.version : ''

const parseMajor = (version: string) => Number.parseInt(version.split('.')[0] ?? '', 10)

const formatDetectedVersion = (version: string) => version || 'unknown'

export const ensureMongoDriverVersion = (version = detectedMongoDbVersion) => {
  const major = parseMajor(version)

  if (!Number.isFinite(major) || major < MIN_MONGODB_DRIVER_MAJOR) {
    const detected = formatDetectedVersion(version)
    throw new Error(
      `@inaiat/fastify-papr requires mongodb driver >=${MIN_MONGODB_DRIVER_MAJOR}. Detected ${detected}.`,
    )
  }
}

export const getDetectedMongoDriverVersion = () => detectedMongoDbVersion
