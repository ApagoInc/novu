const { useBabelRc, override } = require('customize-cra');
const webpack = require('webpack');

function overrideConfig(config, env) {
    // // Polyfill Node core modules for browser
    config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        "fs": false,
        "module": false,
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "assert": require.resolve("assert"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "os": require.resolve("os-browserify"),
        "url": require.resolve("url"),
        "path": require.resolve("path-browserify")
    };

    // Fix ESM fully-specified resolution errors (process/browser etc)
    config.module.rules.push({
        test: /\.m?js/,
        resolve: {
            fullySpecified: false
        }
    });

    // Provide process and Buffer globally
    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    ]);

    return config;
}

module.exports = override(useBabelRc(), overrideConfig);
