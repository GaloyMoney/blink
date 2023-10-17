/** @type {import('next').NextConfig} */

module.exports = {
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../../'),
  },
  output: 'standalone',
};
