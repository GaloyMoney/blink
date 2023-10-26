/** @type {import('next').NextConfig} */

module.exports = {
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../../'),
    serverActions: true,
  },
  output: 'standalone',
};
