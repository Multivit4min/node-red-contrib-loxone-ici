const { LoxoneServer } = require("loxone-ici")

module.exports = function(RED) {
  function LoxoneServerConfig(config) {
    RED.nodes.createNode(this, config)
    this.ownId = config.ownId
    this.listenPort = config.listenPort
    this.remoteId = config.remoteId
    this.host = config.host
    this.port = config.port
    this.loxoneServer = new LoxoneServer({ ownId: this.ownId })
    this.loxoneServer.bind(this.listenPort)
    this.remote = this.loxoneServer.createRemoteSystem({
      remoteId: this.remoteId,
      address: this.host,
      port: this.port
    })
    this.on("close", async (done) => {
      await this.loxoneServer.close()
      this.loxoneServer.removeAllListeners()
      this.remote.removeAllListeners()
      done()
    })
  }
  RED.nodes.registerType("loxone server", LoxoneServerConfig)
}