const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Prevent Metro watcher crashes on transient expo-router maven folders (Windows).
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : config.resolver.blockList
      ? [config.resolver.blockList]
      : []),
  new RegExp(
    `${path
      .join(__dirname, 'node_modules', '.expo-router-')
      .replace(/[/\\]/g, '[\\\\/]')}.*[\\\\/]local-maven-repo[\\\\/].*`
  ),
];

module.exports = withNativeWind(config, { input: './global.css' });
