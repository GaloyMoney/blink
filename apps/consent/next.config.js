/** @type {import('next').NextConfig} */

module.exports = {
  experimental: {
    serverActions: true,
  },
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
};
