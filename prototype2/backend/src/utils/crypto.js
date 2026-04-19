const crypto = require("crypto");

function hashPassword(password) {
  const salt = process.env.PASSWORD_SALT || "campus-rental-salt";
  return crypto
    .createHash("sha256")
    .update(`${salt}${password}`)
    .digest("hex");
}

function comparePassword(password, passwordHash) {
  return hashPassword(password) === passwordHash;
}

module.exports = {
  hashPassword,
  comparePassword,
};

