module.exports = {
  /**
   * returns the nested path in an object
   * @param {object} obj 
   * @param {string} path 
   */
  setPath(obj, path, data) {
    let lastObj
    let lastKey
    path.split(".").reduce((acc, key) => {
      if (typeof acc[key] !== "object" || acc[key] === null) acc[key] = {}
      lastObj = acc
      lastKey = key
      return acc[key]
    }, obj)
    lastObj[lastKey] = data
  },
  getPath(obj, path) {
    const splitted = path.split(".")
    return splitted.reduce((acc, key, i) => {
      if ((typeof acc[key] !== "object" || acc[key] === null) && splitted.length -1 !== i) acc[key] = {}
      return acc[key]
    }, obj)
  }
}