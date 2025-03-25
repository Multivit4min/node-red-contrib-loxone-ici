const { DATA_TYPE } = require("loxone-ici")

const baseFormatter = value => JSON.stringify(value)

const formatDataType = {
  [DATA_TYPE.DIGITAL]: "DIGITAL",
  [DATA_TYPE.ANALOG]: "ANALOG",
  [DATA_TYPE.TEXT]: "TEXT",
  [DATA_TYPE.T5]: "T5",
  [DATA_TYPE.SmartActuatorSingleChannel]: "SmartActuatorSingleChannel",
  [DATA_TYPE.SmartActuatorRGBW]: "SmartActuatorRGBW"
}

const formatter = {
  DIGITAL: baseFormatter,
  ANALOG: baseFormatter,
  TEXT: baseFormatter,
  T5: ({ button }) => {
    switch (button) {
      case 0: return "0/0/0/0/0"
      case 16368: return "1/0/0/0/0"
      case 16416: return "0/1/0/0/0"
      case 16400: return "0/0/1/0/0"
      case 16384: return "0/0/0/1/0"
      case 16432: return "0/0/0/0/1"
      default: return new Error(`invalid button id: ${id}`)
    }
  },
  SmartActuatorSingleChannel: ({ channel, fadeTime }) => {
    let result = [`ch ${channel}`]
    if (fadeTime > 0) result.push(`fade ${fadeTime}s`)
    return result.join(" | ")
  },
  SmartActuatorRGBW: ({ red, green, blue, white, fadeTime }) => {
    return `rgbw ${red}/${green}/${blue}/${white} | fade ${fadeTime}s`
  }
}

module.exports = {
  formatter,
  format(type, value) {
    if (typeof type === "number") type = formatDataType[type]
    if (!formatter[type]) return baseFormatter(value)
    return formatter[type](value)
  }
}