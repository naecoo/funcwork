const path = require('path');
const { build } = require('esbuild');

const formats = {
  'esm': 'index.esm.js',
  'cjs': 'index.js'
}

module.exports = Object.keys(formats).map(format => {
  const fileName = formats[format]
  build({
    format,
    entryPoints: [path.resolve(__dirname, './src/index.js')],
    outfile: path.resolve(__dirname, './dist/', fileName),
    bundle: true,
    minify: true,
    platform: 'browser'
  }).then(() => {
    console.info(`— ${fileName} was built`)
  }).catch((e) => {
    console.info(`🚨 ${fileName} build error:`)
    console.error(e);
  })
})