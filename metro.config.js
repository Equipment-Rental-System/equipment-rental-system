const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.blockList =
  /android[\\/]\.gradle[\\/].*|android[\\/]build[\\/].*|android[\\/]app[\\/]build[\\/].*|backend[\\/]uploads[\\/].*|database[\\/].*|\.expo[\\/].*/;

module.exports = config;
