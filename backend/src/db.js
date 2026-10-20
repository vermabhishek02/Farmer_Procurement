const path = require("path")
const { DatabaseSync } = require("node:sqlite") // built into Node 22.13+, no native install needed

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, "..", "..", "database", "kisan.db")

function open() {
  const db = new DatabaseSync(DB_PATH)
  db.exec("PRAGMA foreign_keys = ON")
  return db
}

module.exports = { open, DB_PATH }
