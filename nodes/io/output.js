const { DATA_TYPE } = require("loxone-ici")
const { getPath } = require("../shared/util.js")
const { format, formatter } = require("../shared/format.js")

module.exports = function(RED) {
  function LoxoneOutputNode(config) {
    RED.nodes.createNode(this, config)

    this.status({ fill: "grey", shape: "dot", text: "" })

    const server = RED.nodes.getNode(config.server)
    if (!server) return this.status({ fill: "red", shape: "dot", text: "no server" })

    /** @type {import("loxone-ici").LoxoneRemoteSystem} */
    const remote = server.remote

    const getValue = (msg, { flow, global }, type, path, fallback) => {
      switch (type) {
        case "msg": return getPath(msg, path)
        case "flow": return getPath(flow, path)
        case "global": return getPath(global, path)
        default:
          if (fallback !== undefined) return fallback
          throw new Error(`invalid source type: ${type}`)
      }
    }

    const defaultHandler = (type) => {
      return (msg) => {
        const val = getValue(msg, this.context(), config.sourceType, config.source)
        const output = remote.createOutput(config.packetId, type)
        if (!output.isTypeValid(val)) return new Error(`invalid value: ${JSON.stringify(val)}`)
        return output.setValue(val)
      }
    }

    function getButtonId(button) {
      switch (button) {
        case 0:
        case "TI0": return 0
        case 1:
        case "TI1": return 16368
        case 2:
        case "TI2": return 16416
        case 3:
        case "TI3": return 16400
        case 4:
        case "TI4": return 16384
        case 5:
        case "TI5": return 16432
        default: return new Error(`invalid button: ${button}`)
      }
    }

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * @type {Record<string, (msg: any): Error|string> }
     */
    const typeHandlers = {
      DIGITAL: defaultHandler(DATA_TYPE.DIGITAL),
      ANALOG: defaultHandler(DATA_TYPE.ANALOG),
      TEXT: defaultHandler(DATA_TYPE.TEXT),
      T5: async (msg) => {
        const duration = getValue(msg, this.context(), config.sourceDurationType, config.sourceDuration, 0.2)
        const val = { button: getButtonId(getValue(msg, this.context(), config.sourceType, config.source)) }
        const out = remote.createOutput(config.packetId, DATA_TYPE.T5)
        if (!out.isTypeValid(button)) return new Error(`invalid value: ${JSON.stringify(val)}`)
        if (duration > 0) {
          this.status({
            fill: "green",
            shape: "dot",
            text: formatter.T5(out.setValue(val).getValue().button)
          })
          await out.setValue(val)
          await sleep(duration * 1000)
          return out.setValue({ button: 0 })
        } else {
          return out.setValue(val)
        }
      },
      SmartActuatorRGBW: (msg) => {
        const res = { bits: 0 }
        res.red = getValue(msg, this.context(), config.sourceRedType, config.sourceRed, 0)
        res.green = getValue(msg, this.context(), config.sourceGreenType, config.sourceGreen, 0)
        res.blue = getValue(msg, this.context(), config.sourceBlueType, config.sourceBlue, 0)
        res.white = getValue(msg, this.context(), config.sourceWhiteType, config.sourceWhite, 0)
        res.fadeTime = getValue(msg, this.context(), config.sourceFadeTimeType, config.sourceFadeTime, 0)
        if (typeof res.fadeTime !== "number" || res.fadeTime < 0) res.fadeTime = 0
        const output = remote.createOutput(config.packetId, DATA_TYPE.SmartActuatorRGBW)
        if (!output.isTypeValid(res)) return new Error(`invalid value: ${JSON.stringify(res)}`)
        return output.setValue(res)
      },
      SmartActuatorSingleChannel: (msg) => {
        const res = {}
        res.channel = getValue(msg, this.context(), config.sourceType, config.source)
        res.fadeTime = getValue(msg, this.context(), config.sourceFadeTimeType, config.sourceFadeTime, 0)
        if (typeof res.fadeTime !== "number" || res.fadeTime < 0) res.fadeTime = 0
        const output = remote.createOutput(config.packetId, DATA_TYPE.SmartActuatorSingleChannel)
        if (!output.isTypeValid(res)) return new Error(`invalid value: ${JSON.stringify(res)}`)
        return output.setValue(res)
      }
    }
    

    const handler = async (msg, send, done) => {
      const handle = typeHandlers[config.dataType]
      if (!handle) return this.status({ fill: "red", shape: "dot", text: `data type ${config.dataType} not found` })
      const out = await handle(msg)
      if (out === undefined) return done(new Error(`no response from output handler`))
      if (out instanceof Error) {
        this.status({ fill: "orange", shape: "dot", text: out.message })
        return done(out)
      }
      if (out instanceof String) {
        this.status({ fill: "orange", shape: "dot", text: out })
        return done()
      }
      this.status({ fill: "green", shape: "dot", text: format(config.dataType, out.getValue()) })
      done()
    }

    this.on("input", handler)

    this.on("close", done => {
      this.removeListener("input", handler)
      done()
    })
  }

  RED.nodes.registerType("loxone out", LoxoneOutputNode)
}