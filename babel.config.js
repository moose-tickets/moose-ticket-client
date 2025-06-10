// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
     presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
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
      ["transform-inline-environment-variables"],
    ],
  };
};
