import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import qiankun from 'vite-plugin-qiankun'

import createVitePlugins from './plugins/index.js'

const resolveExtensions = ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']

const sharedAliasEntries = {
  '@/annotation': './packages/core/src/annotation',
  '@/directive': './packages/core/src/directive',
  '@/hook': './packages/core/src/hook',
  '@/store': './packages/core/src/store',
  '@/utils': './packages/core/src/utils',
  '@lib': './lib',
  '@ruoyi/core': './packages/core/src',
  '@': './src'
}

const backendProxy = {
  '/dev-api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    rewrite: (requestPath) => requestPath.replace(/^\/dev-api/, '')
  },
  '/v3': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    rewrite: (requestPath) => requestPath.replace(/^\/dev-api/, '')
  }
}

function resolveFromWorkspace(workspaceRoot, relativePath) {
  return path.resolve(workspaceRoot, relativePath)
}

function createCssConfig() {
  return {
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
                atRule.remove()
              }
            }
          }
        }
      ]
    }
  }
}

function createServerBase(port) {
  return {
    port,
    host: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
}

function createResolveConfig(workspaceRoot, moduleKey, extraAliasEntries = {}) {
  const aliasEntries = {
    ...sharedAliasEntries,
    [`@${moduleKey}`]: `./packages/modules/module-${moduleKey}/src`,
    ...extraAliasEntries
  }

  return {
    alias: Object.entries(aliasEntries).map(([find, replacement]) => ({
      find,
      replacement: resolveFromWorkspace(workspaceRoot, replacement)
    })),
    extensions: resolveExtensions
  }
}

export function defineQiankunModuleViteConfig({
  currentDir,
  moduleKey,
  port,
  subappName = `ruoyi-${moduleKey}`,
  outDir = `./dist-${moduleKey}`,
  optimizeDeps = [],
  extraAliasEntries = {}
}) {
  return defineConfig(({ mode, command }) => {
    const workspaceRoot = path.resolve(currentDir, '../../..')
    const env = loadEnv(mode, workspaceRoot)
    const isBuild = command === 'build'
    const serverBase = createServerBase(port)

    return {
      root: currentDir,
      envDir: workspaceRoot,
      publicDir: resolveFromWorkspace(workspaceRoot, './public'),
      cacheDir: resolveFromWorkspace(workspaceRoot, `./node_modules/.vite/${moduleKey}-subapp`),
      base: '/',
      plugins: [
        ...createVitePlugins(env, isBuild, {
          svgIconOptions: {
            workspaceRoot
          }
        }),
        qiankun(subappName, {
          useDevMode: !isBuild
        })
      ],
      resolve: createResolveConfig(workspaceRoot, moduleKey, extraAliasEntries),
      server: {
        ...serverBase,
        origin: `http://localhost:${port}`,
        proxy: backendProxy
      },
      preview: serverBase,
      css: createCssConfig(),
      optimizeDeps: {
        include: optimizeDeps
      },
      build: {
        outDir: resolveFromWorkspace(workspaceRoot, outDir),
        emptyOutDir: true,
        commonjsOptions: {
          include: /node_modules|lib/
        }
      }
    }
  })
}