const { DATA_TYPE } = require("loxone-ici")
const { format, formatter } = require("../shared/format.js")
const { getValue, inRange, match, or } = require("../shared/validator.js")

module.exports = function(RED) {
  function LoxoneOutputNode(config) {
    RED.nodes.createNode(this, config)

    this.status({ fill: "grey", shape: "dot", text: "" })

    const server = RED.nodes.getNode(config.server)
    if (!server) return this.status({ fill: "red", shape: "dot", text: "no server" })

    /** @type {import("loxone-ici").LoxoneRemoteSystem} */
    const remote = server.remote

    /**
     * 
     * @param {import("loxone-ici").DATA_TYPE} dataType 
     * @param {string} type 
     * @returns 
     */
    const defaultHandler = (dataType, type) => {
      return (msg) => {
        const value = getValue({ payload: msg, key: "payload", type })
        const output = remote.createOutput(config.packetId, dataType)
        if (!output.isTypeValid(value)) throw new Error(`invalid value: ${JSON.stringify(value)}`)
        return output.setValue(value)
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
     * @type {Record<string, (msg: any) => Error|any> }
     */
    const typeHandlers = {
      DIGITAL: defaultHandler(DATA_TYPE.DIGITAL, "boolean"),
      ANALOG: defaultHandler(DATA_TYPE.ANALOG, "number"),
      TEXT: defaultHandler(DATA_TYPE.TEXT, "string"),
      T5: async (msg) => {
        const duration = getValue({
          payload: msg.payload,
          key: "duration",
          type: "number",
          fallback: 0,
          validator: inRange(0, Infinity)
        })
        const button = getButtonId(getValue({
          payload: msg.payload,
          key: "button",
          type: ["string", "number"],
          validator: or(
            inRange(0, 5),
            match(/^(TI0|TI1|TI2|TI3|TI4|TI5)$/)
          )
        }))
        if (button instanceof Error) return button
        const out = remote.createOutput(config.packetId, DATA_TYPE.T5)
        if (!out.isTypeValid({ button })) throw new Error(`invalid T5 value: ${JSON.stringify(button)}`)
        if (duration > 0) {
          this.status({
            fill: "green",
            shape: "dot",
            text: formatter.T5(out.setValue({ button }).getValue().button)
          })
          await out.setValue({ button })
          await sleep(duration * 1000)
          return out.setValue({ button: 0 })
        } else {
          return out.setValue({ button })
        }
      },
      SmartActuatorRGBW: (msg) => {
        const res = {}
        res.bits = getValue({
          payload: msg.payload,
          key: "bits",
          type: "number",
          fallback: 0,
          validator: inRange(0, 0)
        })
        res.red = getValue({
          payload: msg.payload,
          key: "red",
          type: "number",
          validator: inRange(0, 100)
        })
        res.green = getValue({
          payload: msg.payload,
          key: "green",
          type: "number",
          validator: inRange(0, 100)
        })
        res.blue = getValue({
          payload: msg.payload,
          key: "blue",
          type: "number",
          validator: inRange(0, 100)
        })
        res.white = getValue({
          payload: msg.payload,
          key: "white",
          type: "number",
          validator: inRange(0, 100)
        })
        res.fadeTime = getValue({
          payload: msg.payload,
          key: "fadeTime",
          type: "number",
          fallback: 0,
          validator: inRange(0, Infinity)
        })
        const output = remote.createOutput(config.packetId, DATA_TYPE.SmartActuatorRGBW)
        if (!output.isTypeValid(res)) throw new Error(`invalid value: ${JSON.stringify(res)}`)
        return output.setValue(res)
      },
      SmartActuatorSingleChannel: (msg) => {
        const res = {}
        res.channel = getValue({
          payload: msg.payload,
          key: "channel",
          type: "number",
          validator: inRange(0, 100)
        })
        res.fadeTime = getValue({
          payload: msg.payload,
          key: "fadeTime",
          type: "number",
          fallback: 0,
          validator: inRange(0, Infinity)
        })
        const output = remote.createOutput(config.packetId, DATA_TYPE.SmartActuatorSingleChannel)
        if (!output.isTypeValid(res)) throw new Error(`invalid value: ${JSON.stringify(res)}`)
        return output.setValue(res)
      }
    }
    

    const handler = async (msg, send, done) => {
      const handle = typeHandlers[config.dataType]
      if (!handle) return this.status({ fill: "red", shape: "dot", text: `data type ${config.dataType} not found` })
      let out
      try {
        out = await handle(msg)
        this.status({ fill: "green", shape: "dot", text: format(config.dataType, out.getValue()) })
      } catch (e) {
        if (!(e instanceof Error)) return this.status({ fill: "red", shape: "dot", text: `invalid response` })
        return this.status({ fill: "red", shape: "dot", text: e.message })
      }
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