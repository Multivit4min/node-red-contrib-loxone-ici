const { typeToString } = require("../shared/dataType")
const { format } = require("../shared/format.js")

module.exports = function(RED) {
  function LoxoneInputNode(config) {
    RED.nodes.createNode(this, config)

    const node = this

    this.status({ fill: "grey", shape: "dot" })

    const server = RED.nodes.getNode(config.server)
    if (!server) return node.status({ fill: "red", shape: "dot", text: "no server" })

    let lastValue = undefined

    /** @type {import("loxone-ici").LoxoneServer} */
    const loxoneServer = server.loxoneServer

    /** @param {import("loxone-ici").LoxoneServer.InputEvent} data  */
    const eventHandler = data => {
      //check if packet is the one we are looking for
      if (data.packet.packetId !== config.packetId) return
      //update the status value
      node.status({ fill: "green", shape: "dot", text: format(data.packet.type, data.packet.payload.value) })
      //check if there is an actual change
      const newValue = JSON.stringify(data.packet.payload.value)
      if (lastValue === newValue) return
      lastValue = newValue
      //prepare sendable message object
      node.send({
        topic: data.packet.packetId,
        payloadType: typeToString[data.packet.type],
        payload: data.packet.payload.value
      })
    }

    loxoneServer.on("input", eventHandler)
    node.on("close", done => {
      loxoneServer.removeListener("input", eventHandler)
      done()
    })

  }
  RED.nodes.registerType("loxone in", LoxoneInputNode)
}