const execSync = require('child_process').execSync
const package = require('./package.json')

const VALID_ARGUMENTS = {
  FILE_NAME_CONTAINING_VARIABLES: 'fileWithVariables'
}

function getHumanRedableListOfValidArguments() {
  return Object.values(VALID_ARGUMENTS).map(function(element, index, array) {
    if (index === (array.length - 1)) {
      return `"${element}"`
    }
    return `"${element}", `
  }).join('')
}

const VALID_ARGUMENT_LIST_AND_FORMAT_MESSAGE = `Valid arguments are: ${getHumanRedableListOfValidArguments()}.\n\nAnd must have the format "--key=value"`
const resolveInvalidCommandArgumentErrorMessage = function(arg) { return `Provided invalid argument "${arg}".\n${VALID_ARGUMENT_LIST_AND_FORMAT_MESSAGE}` }
const resolveArgumentMissingEqualSignErrorMessage = function(arg) { return `Provided invalid argument format "${arg}". The format should be "--key=value" with an "=" (equal sign) separating the key and the value` }
const resolveArgumentMissingPrefixErrorMessage = function(arg) { return `Provided invalid argument format "${arg}". The format should be "--key=value" with an "--" (double sash) prefixing the argument's key` }

// Command argument format should be "--key=value"
function resolveIsValidCommandArgumentOrThrowError(arg) {
  const indexOfPrefix = arg.indexOf('--')

  if (indexOfPrefix === -1) {
    throw new Error(resolveArgumentMissingPrefixErrorMessage(arg))
  }

  const argumentIncludesValidKey = arg.includes(VALID_ARGUMENTS.FILE_NAME_CONTAINING_VARIABLES)

  if (!argumentIncludesValidKey) {
    throw new Error(resolveInvalidCommandArgumentErrorMessage(arg))
  }

  const indexOfEqualSign = arg.indexOf('=')

  if (indexOfEqualSign === -1) {
    throw new Error(resolveArgumentMissingEqualSignErrorMessage(arg))
  }

  // Argument is a valid
  return true
}

function parseArguments() {
  if (process.argv.length) {
    return process.argv.reduce(function (accumulator, currentValue, index) {
      // Skip the two first arguments which will always be 'node' and the file that we are in
      if (index === 0 || index === 1) {
        return {}
      }

      resolveIsValidCommandArgumentOrThrowError(currentValue)

      try {
        const [key, value] = currentValue.split('--')[1].split('=')

        // Assign the key and value of the argument as the key and value of an actual javascript object
        return { ...accumulator, [key]: value }
      } catch (error) {
        throw new Error(error)
      }
    }, {});

  }
  return {}
}

function isObject(value) {
  return typeof value === 'object' && value !== null
}

function objectIsEmpty(obj) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object
}

function replaceUrlInterpolationWithVariableValue(url) {
  return url.replace(/\${([0-9a-zA-Z_]*)}/g, (_, varName) => {

    if (typeof env[varName] === 'string') {
      return env[varName]
    } else {
      throw new Error(`Could not read env variable ${varName} in url ${url}`)
    }
  })
}

// ---- Logic starts here ---

if (!package.internalDependencies) {
  return process.exit(0)
}

let env = Object.assign({}, process.env)

const parsedArguments = parseArguments()

if (parsedArguments.fileWithVariables) {
  try {
    const extractedVariables = require(parsedArguments.fileWithVariables)
    env = {
      ...extractedVariables,
      ...env
    }
  } catch (err) {
    console.log(`Could not read or parse the file containing the variables.\nAre you sure "${parsedArguments.fileWithVariables}" is the correct path to the file?\n\nProcessing with enviroment variables only.\n`)
  }
}

if (!isObject(package.internalDependencies) || objectIsEmpty(package.internalDependencies)) {
  console.log(`package.internalDependencies not found or empty. Passing.`)
  process.exit(0)
}

const parsed = Object.keys(package.internalDependencies)
  .map(function(key) {
    const url = package.internalDependencies[key]

    // The key is used as the name of the package
    return key + '@' + replaceUrlInterpolationWithVariableValue(url)
  })
  .join(' ') // Join all urls with a space so npm can install them as different packages but in one command

try {
  // Installs the packages without saving them to the package.json file,
  // which would write the literal urls and expose the variable
  execSync('npm install --no-save ' + parsed, { stdio: [0, 1, 2] })
  process.exit(0)
} catch (err) {
  throw new Error('Could not install package.internalDependencies. Are you sure the remote URLs all have a package.json?')
}
