const { useBabelRc, override } = require('customize-cra');
// const webpack = require('webpack')
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

function overrideConfig(config, env) {
  // moved const plugins = [...config.plugins, /* new BundleAnalyzerPlugin() */];

  // // 
  // const fallback = config.resolve.fallback || {};
  // Object.assign(fallback, {
  //     "crypto": require.resolve("crypto-browserify"),
  //     "stream": require.resolve("stream-browserify"),
  //     "assert": require.resolve("assert"),
  //     "http": require.resolve("stream-http"),
  //     "https": require.resolve("https-browserify"),
  //     "os": require.resolve("os-browserify"),
  //     "url": require.resolve("url")
  // })
  // config.resolve.fallback = fallback;
  // config.plugins = (config.plugins || []).concat([
  //     new webpack.ProvidePlugin({
  //         process: 'process/browser',
  //         Buffer: ['buffer', 'Buffer']
  //     })
  // ])
  // // 

  // // 
  const plugins = [...config.plugins, /* new BundleAnalyzerPlugin() */];


  return { ...config, plugins };
}

module.exports = override(useBabelRc(), overrideConfig);
