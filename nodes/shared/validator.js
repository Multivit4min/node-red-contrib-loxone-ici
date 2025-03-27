/**
 * @typedef {object} GetValueProps
 * @property {{ [key: string]: any }} payload
 * @property {string} key 
 * @property {string|string[]} type 
 * @property {any} [fallback]
 * @property {(value: any) => true|Error} [validator]
 */



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
  if (typeof validator === "function") validator(payload[key])
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
  throw Error(`invalid type: expected ${types.join(" or ")} but got ${typeof value}${location ? ` on .${location}` : ""}`)
}

/**
 * checks if the specified numer is in range
 * @param {number} min 
 * @param {number} max 
 * @returns {(value: any) => true}
 */
function inRange(min, max) {
  /**
   * @param {any} value
   * @returns {true}
   */
  return value => {
    expectType("number", value)
    if (value >= min && value <= max) return true
    if (value < min) throw new Error(`value ${value} is too low`)
    if (value > max) throw new Error(`value ${value} is too high`)
    throw new Error("something went wrong")
  }
}

/**
 * checks for a string match
 * @param {RegExp} regex
 * @returns {(value: any) => true}
 */
function match(regex) {
  /**
   * @param {any} value
   * @returns {true}
   */
  return value => {
    expectType("string", value)
    if (regex.test(value)) return true
    throw new Error(`invalid string: "${value}", should match ${regex}`)
  }
}

/**
 * 
 * @param  {...(value: any) => true} funcs 
 */
function or(...funcs) {
  /**
   * @param {any} value
   * @returns {true}
   */
  return value => {
    /** @type {Error[]} */
    const errors = []
    const ok = funcs.some(f => {
      try {
        return f(value)
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