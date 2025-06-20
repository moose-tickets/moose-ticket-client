// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
     presets: [
      [
        "babel-preset-expo", 
        { 
          jsxImportSource: "nativewind",
          // Ensure proper environment variable inlining
          env: {
            development: {},
            production: {}
          }
        }
      ],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            buffer: "buffer",
            process: "process/browser",
          },
        },
      ],
      [
        "transform-inline-environment-variables",
        {
          // Ensure EXPO_OS and other environment variables are properly inlined
          include: ["EXPO_OS", "NODE_ENV", "__DEV__"]
        }
      ],
    ],
  };
};
