const { DATA_TYPE } = require("loxone-ici")

const typeToString = {
  [DATA_TYPE.DIGITAL]: "DIGITAL",
  [DATA_TYPE.ANALOG]: "ANALOG",
  [DATA_TYPE.TEXT]: "TEXT",
  [DATA_TYPE.T5]: "T5",
  [DATA_TYPE.SmartActuatorRGBW]: "SmartActuatorRGBW",
  [DATA_TYPE.SmartActuatorSingleChannel]: "SmartActuatorSingleChannel",
  [DATA_TYPE.SmartActuatorTunableWhite]: "SmartActuatorTunableWhite",
}

module.exports = {
  typeToString,
  stringToType: Object.entries(typeToString).reduce((acc, [key, value]) => {
    acc[value] = parseInt(key, 10)
    return acc
  }, {})
}