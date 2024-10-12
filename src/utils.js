const fs = require('fs').promises;

async function loadConfig(configPath) {
  if (configPath) {
    try {
      return JSON.parse(await fs.readFile(configPath, 'utf-8'));
    } catch (error) {
      console.error(`Error reading config file: ${error.message}`);
      process.exit(1);
    }
  }
  return {};
}

module.exports = { loadConfig };