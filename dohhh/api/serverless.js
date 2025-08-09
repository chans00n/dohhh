const express = require("express");
const { GracefulShutdownServer } = require("@medusajs/medusa");

let app;
let server;

async function getApp() {
  if (app) {
    return app;
  }

  // Import Medusa configuration
  const { getConfigFile } = require("@medusajs/medusa/dist/loaders/config");
  const configModule = getConfigFile(process.cwd(), "medusa-config");
  
  // Bootstrap the app
  const { bootstrap } = require("@medusajs/medusa");
  
  app = express();
  const { container } = await bootstrap({
    directory: process.cwd(),
    expressApp: app,
  });

  // Create graceful shutdown server
  server = GracefulShutdownServer.create(
    app,
    container.resolve("eventBusService"),
    {}
  );

  return app;
}

module.exports = async (req, res) => {
  const app = await getApp();
  return app(req, res);
};