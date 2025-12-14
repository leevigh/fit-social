import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude problematic packages from server-side bundling
  serverExternalPackages: [
    'tap',
    'tape',
    'why-is-node-running',
    'thread-stream',
  ],
  
  // Note: We're using webpack via --webpack flag in build script
  // Turbopack configuration is not needed when using webpack
  
  webpack: (config, { isServer }) => {
    // Ignore test files and dev dependencies that shouldn't be bundled
    const webpack = require('webpack');
    
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/test\//,
        contextRegExp: /thread-stream/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^(tap|tape|why-is-node-running)$/,
      }),
      // Ignore LICENSE files and other non-code files in node_modules
      new webpack.IgnorePlugin({
        resourceRegExp: /\/LICENSE$/,
        contextRegExp: /node_modules/,
      }),
      // Ignore test files more broadly in node_modules
      new webpack.IgnorePlugin({
        resourceRegExp: /\.test\.(js|ts|tsx|jsx)$/,
        contextRegExp: /node_modules/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /\.spec\.(js|ts|tsx|jsx)$/,
        contextRegExp: /node_modules/,
      }),
      // Ignore test directories in node_modules
      new webpack.IgnorePlugin({
        resourceRegExp: /\/test\//,
        contextRegExp: /node_modules/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /\/tests\//,
        contextRegExp: /node_modules/,
      })
    );

    // Ignore test files in node_modules
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      'tap': false,
      'tape': false,
      'why-is-node-running': false,
    };

    return config;
  },
};

export default nextConfig;
