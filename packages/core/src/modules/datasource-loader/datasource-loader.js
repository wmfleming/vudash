'use strict'

const resolver = require('../resolver')
const configValidator = require('../config-validator')
const datasourceBinder = require('../datasource-binder')

const loadError = 'Cannot load datasource someDatasource because it does not look like a datasource'

function resolveDatasource (path) {
  return resolver.resolve(path)
}

function parseConfiguration (pluginName, validation, options) {
  return configValidator.validate(pluginName, validation, options)
}

function register (registrationFn, configuration) {
  if (typeof registrationFn !== 'function') {
    throw new Error(`${loadError} (no registration function)`)
  }

  return registrationFn(configuration)
}

function initialise (registrationFn, configuration = {}, schedule) {
  const datasource = register(registrationFn, configuration)

  if (typeof datasource.fetch !== 'function') {
    throw new Error(`${loadError} (no fetch function)`)
  }

  return datasourceBinder.bind(datasource, schedule)
}

exports.load = function (descriptor) {
  const datasourceNames = Object.keys(descriptor)
  return datasourceNames.reduce((datasources, name) => {
    const { module: path, options, schedule } = descriptor[name]
    const { validation, register } = resolveDatasource(path)
    const configuration = parseConfiguration(name, validation, options)
    datasources[name] = initialise(register, configuration, schedule)
    return datasources
  }, {})
}
