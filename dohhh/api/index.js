const { createServer } = require("@medusajs/medusa")

module.exports = async (req, res) => {
  const server = await createServer()
  return server(req, res)
}