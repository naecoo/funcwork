import babel from 'rollup-plugin-babel' 
import { terser } from 'rollup-plugin-terser'

const config = {
  input: 'src/index.js',
  output: [{
    file: 'dist/funcwork.es.js',
    format: 'es'
  }, {
    file: 'dist/funcwork.umd.js',
    format: 'umd',
    name: 'funcwork'
  }],
  plugins: [
    babel({
      exclude: '**/node_modules/**',
      runtimeHelpers: true
    }),
    terser({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
      }
    })
  ]
}

export default config