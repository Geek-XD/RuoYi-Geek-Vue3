# AGENTS

## 基本约束
- 所有对话和文档使用中文。该要求来自用户级 `CLAUDE.md`。
- 这是单仓库前端项目，但通过 npm workspaces 把 `packages/*` 和 `modules/*` 作为本地包接入；不要把它当成多仓库独立发布结构。

## 真实可用命令
- 以 `package.json` 为准，根脚本只有：`npm run dev`、`npm run build:prod`、`npm run build:stage`、`npm run preview`。
- `README.md` 仍写 `yarn`，但仓库同时提交了 `yarn.lock` 和 `pnpm-lock.yaml`，且 `.gitignore` 忽略两者；不要仅凭 README 假设团队只用 Yarn。
- `vite.config.js` 将开发服务器固定在 `80` 端口，代理 `/dev-api` 和 `/v3` 到 `http://localhost:8080`。
- 仓库里没有已配置好的 `lint`、`test`、`typecheck` 脚本，也没找到 ESLint / Prettier / Vitest / Jest / Playwright 配置；不要在交付说明里声称已运行这些默认检查，除非你先新增并明确说明。

## 代码入口与边界
- 应用入口是 `src/main.ts`。这里统一挂载路由、Pinia、插件、指令、全局组件和 `lib/vform`。
- 业务宿主代码在 `src/`，共享基础设施在 `packages/core/`，功能模块在 `modules/flowable|form|message|online|pay/`。
- 路由核心在 `packages/core/router/`，权限与动态菜单组装在 `packages/core/store/modules/permission.ts`。

## 路由与页面接线规则
- `packages/core/constant/index.ts` 用 `import.meta.glob('/**/routes/index.{ts,js}', { eager: true })` 自动收集所有模块路由；新增模块路由时，文件名必须是 `routes/index.ts` 或 `routes/index.js`。
- 只有 `modules/flowable/routes/index.ts` 这类显式模块路由会在启动时直接并入 `constantRoutes`。
- 后端返回的菜单组件字符串由 `packages/core/router/utils/utils.ts` 的 `loadView()` 解析：
- `src/views/**/*.vue` 会映射为不带前缀的路径，如后端组件名 `system/user/index` 对应 `src/views/system/user/index.vue`。
- `modules/<name>/views/**/*.vue` 会映射为 `<name>/...`，如后端组件名 `flowable/task/todo/detail/index` 对应 `modules/flowable/views/task/todo/detail/index.vue`。
- 如果组件路径不匹配上述规则，`loadView()` 会回退成空白占位组件，不会直接报错；排查菜单白屏时先检查后端组件名与文件路径是否一致。

## 别名与导入习惯
- Vite 和 TS 都定义了这些别名：`@` -> `src`，`@ruoyi/core` -> `packages/core`，各 `@ruoyi/module-*` -> 对应 `modules/*`，`@lib` -> `lib`。
- 根依赖通过 `file:` 指向本地 workspace 包；修改 `packages/core` 或 `modules/*` 通常不需要额外构建步骤，Vite 会直接消费源码。

## 环境与构建细节
- Node 版本要求来自根 `package.json`：`^20.19.0 || >=22.12.0`。
- 环境文件只有 `.env.development`、`.env.staging`、`.env.production`。API 基础路径分别是 `/dev-api`、`/stage-api`、`/prod-api`，路由基路径都为 `/`。
- `vite/plugins/auto-import.js` 开启了 `vue`、`vue-router`、`pinia` 自动导入，且 `dts: false`；新增大量自动导入 API 时，不要期待仓库会生成类型声明文件。
- `vite.config.js` 对 `lib/` 也开启了 CommonJS 兼容，且显式预构建 `@lib/vform/designer.umd.js`；`lib/vform` 更像 vendored 依赖，除非任务明确要求，否则优先避免改这里。

## 修改时的高风险点
- `src/components/index.ts` 统一注册 Element Plus、全量图标和多个全局业务组件；改动全局 UI 行为时先看这里，避免在页面里重复注册。
- 登录后动态路由是在前置守卫里通过 `router.addRoute()` 注入的；与权限、菜单、首屏跳转相关的问题，优先联查 `packages/core/router/guards/beforeEach.ts` 和 `packages/core/store/modules/permission.ts`。
- `.gitignore` 忽略 `dist/`、`node_modules/` 以及锁文件；不要把锁文件变更当成必须提交的常规产物。
