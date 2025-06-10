// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// 1. pull in Expo’s default Metro config
const defaultConfig = getDefaultConfig(__dirname);

// 2. patch in your node-core shims
const config = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    extraNodeModules: {
      // crypto
      "node:crypto": require.resolve("crypto-browserify"),
      crypto: require.resolve("crypto-browserify"),

      // streams
      "node:stream": require.resolve("stream-browserify"),
      stream: require.resolve("stream-browserify"),

      // events
      "node:events": require.resolve("events/"),
      events: require.resolve("events/"),

      // buffer & process
      buffer: require.resolve("buffer/"),
      process: require.resolve("process/browser"),

      // assert
      assert: require.resolve("assert/"),

      // If you need path, os, etc., uncomment below:
      // path: require.resolve("path-browserify"),
      // os: require.resolve("os-browserify/browser"),
    },
  },
};

// 3. wrap it all with NativeWind
module.exports = withNativeWind(config, {
  input: "./global.css",
});
