import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import createVitePlugins from './vite/plugins'

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd())
  const { VITE_APP_ENV, VITE_BASE_ROUTER } = env
  return {
    // 部署生产环境和开发环境下的URL。
    // 默认情况下，vite 会假设你的应用是被部署在一个域名的根路径上
    // 例如 https://www.ruoyi.vip/。如果应用被部署在一个子路径上，你就需要用这个选项指定这个子路径。例如，如果你的应用被部署在 https://www.ruoyi.vip/admin/，则设置 baseUrl 为 /admin/。
    base: VITE_APP_ENV === 'production' ? VITE_BASE_ROUTER : VITE_BASE_ROUTER,
    plugins: createVitePlugins(env, command === 'build'),
    resolve: {
      // https://cn.vitejs.dev/config/#resolve-alias
      alias: [
        { find: '@/annotation', replacement: path.resolve(__dirname, './packages/core/src/annotation') },
        { find: '@/directive', replacement: path.resolve(__dirname, './packages/core/src/directive') },
        { find: '@/hook', replacement: path.resolve(__dirname, './packages/core/src/hook') },
        { find: '@/store', replacement: path.resolve(__dirname, './packages/core/src/store') },
        { find: '@/utils', replacement: path.resolve(__dirname, './packages/core/src/utils') },
        { find: '~', replacement: path.resolve(__dirname, './') },
        { find: '@lib', replacement: path.resolve(__dirname, './lib') },
        { find: '@modules', replacement: path.resolve(__dirname, './src/modules') },
        { find: '@ruoyi/core', replacement: path.resolve(__dirname, './packages/core/src') },
        { find: '@ruoyi/module-flowable', replacement: path.resolve(__dirname, './packages/modules/module-flowable/src/index.ts') },
        { find: '@ruoyi/module-form', replacement: path.resolve(__dirname, './packages/modules/module-form/src/index.ts') },
        { find: '@ruoyi/module-message', replacement: path.resolve(__dirname, './packages/modules/module-message/src/index.ts') },
        { find: '@ruoyi/module-online', replacement: path.resolve(__dirname, './packages/modules/module-online/src/index.ts') },
        { find: '@ruoyi/module-pay', replacement: path.resolve(__dirname, './packages/modules/module-pay/src/index.ts') },
        { find: '@flowable', replacement: path.resolve(__dirname, './packages/modules/module-flowable/src') },
        { find: '@form', replacement: path.resolve(__dirname, './packages/modules/module-form/src') },
        { find: '@message', replacement: path.resolve(__dirname, './packages/modules/module-message/src') },
        { find: '@online', replacement: path.resolve(__dirname, './packages/modules/module-online/src') },
        { find: '@pay', replacement: path.resolve(__dirname, './packages/modules/module-pay/src') },
        { find: '@', replacement: path.resolve(__dirname, './src') },
      ],
      // https://cn.vitejs.dev/config/#resolve-extensions
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },
    // vite 相关配置
    server: {
      port: 80,
      host: true,
      open: false,  // 启动时是否启动自动打开浏览器
      proxy: {
        // https://cn.vitejs.dev/config/#server-proxy
        '/dev-api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/dev-api/, '')
        },
        '/v3': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/dev-api/, '')
        }
      }
    },
    //fix:error:stdin>:7356:1: warning: "@charset" must be the first rule in the file
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      },
      postcss: {
        plugins: [
          {
            postcssPlugin: 'internal:charset-removal',
            AtRule: {
              charset: (atRule) => {
                if (atRule.name === 'charset') {
                  atRule.remove();
                }
              }
            }
          }
        ]
      }
    },
    optimizeDeps: {
      include: [
        '@lib/vform/designer.umd.js',
      ]
    },
    build: {
      commonjsOptions: {
        include: /node_modules|lib/
      }
    }
  }
})
