const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const fs = require('fs');
const path = require('path');

let config = getDefaultConfig(__dirname);
config = withNativeWind(config, { input: './global.css' });

// react-native-maps@1.27+ ships TypeScript source; Metro must resolve .ts/.tsx in node_modules.
config.resolver.sourceExts = [...new Set([...config.resolver.sourceExts, 'ts', 'tsx'])];

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.startsWith('.') &&
    context.originModulePath.includes(`${path.sep}react-native-maps${path.sep}`)
  ) {
    const base = path.resolve(path.dirname(context.originModulePath), moduleName);
    for (const ext of ['.tsx', '.ts', '.jsx', '.js', '.json']) {
      const candidate = `${base}${ext}`;
      if (fs.existsSync(candidate)) {
        return { type: 'sourceFile', filePath: candidate };
      }
    }
    if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
      for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
        const candidate = path.join(base, `index${ext}`);
        if (fs.existsSync(candidate)) {
          return { type: 'sourceFile', filePath: candidate };
        }
      }
    }
  }

  // Always fall through to Expo/Metro default (keeps @/ tsconfig path aliases working).
  if (typeof defaultResolveRequest === 'function') {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
