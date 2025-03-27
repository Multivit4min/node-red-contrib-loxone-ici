/**
 * @typedef {object} GetValueProps
 * @property {{ [key: string]: any }} payload
 * @property {string} key 
 * @property {string|string[]} type 
 * @property {any} [fallback]
 * @property {(value: any, location?: string) => true|Error} [validator]
 */

/**
 * Gets the location description
 * @param {string} [location]
 * @returns {string}
 */
function getLocation(location) {
  return location ? ` on .${location}` : ""
}


/**
 * 
 * @param {GetValueProps} props
 */
function getValue({ payload, key, type, fallback, validator }) {
  if (typeof payload !== "object" || payload === null) throw new Error(`invalid msg.payload`)
  if (payload[key] === undefined) {
    if (fallback !== undefined) return fallback
    throw new Error(`no value given for key ${key}`)
  }
  expectType(type, payload[key], key)
  if (typeof validator === "function") validator(payload[key], key)
  return payload[key]
}

/**
 * 
 * @param {string|string[]} types 
 * @param {any} value 
 * @param {string} [location] 
 */
function expectType(types, value, location) {
  if (!Array.isArray(types)) types = [types]
  if (types.includes(typeof value)) return true
  throw Error(`expected ${types.join(" or ")} but got ${typeof value}${getLocation(location)}`)
}

/**
 * checks if the specified numer is in range
 * @param {number} min 
 * @param {number} max 
 * @returns {(value: any, location?: string) => true}
 */
function inRange(min, max) {
  /**
   * @param {any} value
   * @param {string} [location]
   * @returns {true}
   */
  return (value, location) => {
    expectType("number", value)
    if (value >= min && value <= max) return true
    if (value < min) throw new Error(`value ${value} must be >= ${min}${getLocation(location)}`)
    if (value > max) throw new Error(`value ${value} must be <= ${max}${getLocation(location)}`)
    throw new Error(`something went wrong${getLocation(location)}`)
  }
}

/**
 * checks for a string match
 * @param {RegExp} regex
 * @returns {(value: any, location?: string) => true}
 */
function match(regex) {
  /**
   * @param {any} value
   * @param {string} [location]
   * @returns {true}
   */
  return (value, location) => {
    expectType("string", value)
    if (regex.test(value)) return true
    throw new Error(`"${value}", should match ${regex}${getLocation(location)}`)
  }
}

/**
 * 
 * @param  {...(value: any, location: string|undefined) => true} funcs 
 */
function or(...funcs) {
  /**
   * @param {any} value
   * @param {string} [location]
   * @returns {true}
   */
  return (value, location) => {
    /** @type {Error[]} */
    const errors = []
    const ok = funcs.some(f => {
      try {
        return f(value, location)
      } catch (e) {
        if (e instanceof Error) errors.push(e)
        return false
      }
    })
    if (ok) return true
    throw errors[0]
  }
}

module.exports = {
  getValue,
  inRange,
  match,
  or
}