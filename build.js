const { resolve } = require('path');
const { build, buildSync } = require('esbuild');

const formats = {
  'cjs': 'index.js',
  'esm': 'index.esm.js',
  'iife': 'index.iife.js'
}

const buildWorker = () => {
  const result = buildSync({
    format: 'iife',
    entryPoints: [resolve(__dirname, './src/worker.ts')],
    bundle: true,
    minify: true,
    write: false,
    platform: 'browser',
    loader: {
      '.ts': 'ts'
    },
    tsconfig: resolve(__dirname, './tsconfig.json')
  })
  return Buffer.from(result.outputFiles[0].contents).toString('utf-8')
};

const workerScriptContent = JSON.stringify(buildWorker());
module.exports = Object.keys(formats).map(format => {
  const fileName = formats[format]
  build({
    format,
    globalName: 'funcWork',
    entryPoints: [resolve(__dirname, './src/index.ts')],
    outfile: resolve(__dirname, './dist/', fileName),
    bundle: true,
    minify: true,
    sourcemap: true,
    platform: 'browser',
    loader: {
      '.ts': 'ts'
    },
    define: {
      '__WORKER_SCRIPT__': workerScriptContent
    },
    tsconfig: resolve(__dirname, './tsconfig.json')
  }).then(() => {
    console.info(`— ${fileName} was built`)
  }).catch((e) => {
    console.info(`🚨 ${fileName} build error:`)
    console.error(e);
  })
})