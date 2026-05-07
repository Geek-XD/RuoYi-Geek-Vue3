# Flowable 模块本轮完善分析与收口说明

## 范围说明

本说明覆盖本轮与 Flowable7 前端完善直接相关的交付，范围不再只限于 `modules/flowable/components/Process/`，同时包含以下链路：

1. `modules/flowable/components/Process/` 设计器、查看器、面板与汉化。
2. `modules/flowable/components/Flow/` 通用流程表单组件。
3. `modules/flowable/views/` 下流程定义、待办、已办、我发起、监听器、表达式等页面。

本轮目标是：在**不新增依赖、不重写 UI、不改后端主链路**的前提下，完成 Flowable7 模块前端可用性增强与代码收口。

---

## 本轮完成的核心工作

### 1. 设计器能力分层：常规功能 / 高级功能

- 位置：`modules/flowable/components/Process/designer.vue`
- 本轮将右侧配置面板拆分为“常规功能”和“高级功能”两组。
- 处理结果：
  - 常规配置默认展开，降低常见建模操作的认知负担。
  - 高级配置集中收口，避免一次性暴露过多选项影响使用体验。
  - 多实例面板改为按元素类型动态显隐，不再无差别展示。

### 2. 补齐缺失面板

- 新增面板：
  - `panel/serviceTaskLikePanel.vue`
  - `panel/scriptTaskPanel.vue`
  - `panel/callActivityPanel.vue`
- 处理结果：
  - 服务类任务、脚本任务、调用活动不再只能依赖零散属性编辑。
  - 设计器与 Flowable7 常见建模场景的贴合度更高。
  - 面板职责保持单一，未把复杂逻辑继续堆进 `designer.vue`。

### 3. 汉化补全与错误术语修正

- 位置：`modules/flowable/components/Process/lang/zh.ts`
- 本轮补齐了 replace / append 菜单相关文案，并修正了部分明显误译。
- 已确认修正的关键项包括：
  - `Append *` 系列操作文案
  - `Escalation End Event` -> `升级结束事件`
  - `Transaction` -> `事务`
- 结果：建模菜单和元素替换菜单的中文一致性明显提升。

### 4. Flowable7 元素可用性边界梳理

本轮没有把“Flowable7 引擎支持”直接等同于“当前项目前后端已经完整接通支持”，而是拆成两层判断：

- **引擎层可识别**：Flowable7 作为 BPMN 引擎本身支持更多标准元素。
- **项目层可闭环**：当前项目前后端、表单、监听器、审批链路是否已经真正接通。

当前更适合直接用于本项目业务闭环的，主要仍是：

- `StartEvent`
- `EndEvent`
- `UserTask`
- `ExclusiveGateway`
- 基础顺序流条件
- 基础 `SubProcess`

当前属于“可建模，但要结合具体场景谨慎使用”的包括：

- `ServiceTask`
- `ReceiveTask`
- `CallActivity`
- `ParallelGateway`
- 部分扩展事件与复杂子流程玩法

不建议因为前端菜单可选就直接投入业务主链路的包括：

- `BusinessRuleTask`
- `ManualTask`
- 复杂事件网关 / 包容网关高级组合
- 大部分未在现有后端链路中形成稳定处理闭环的边界事件、中间事件派生能力

结论不是“这些元素绝对不能用”，而是**当前项目并未对它们提供同等成熟度的业务闭环保证**。

### 5. `modules/flowable/` 全量 `<script setup>` 迁移

本轮已将 `modules/flowable/` 下活跃 Vue 组件统一迁移到 `<script setup>`。

覆盖范围包括：

- `components/Process/` 下设计器、查看器、各配置面板
- `components/Flow/` 下通用流程组件
- `views/` 下流程定义、待办、已办、我发起、监听器、表达式等页面

迁移过程中同步修复了真实暴露的问题，而不是只做语法替换：

- `views/task/todo/detail/index.vue` 中多个表单 `ref` 错位问题
- 列表页 API 命名冲突问题：
  - `todoList as todoListApi`
  - `finishedList as finishedListApi`
  - `myProcessList as myProcessListApi`

本轮策略是“**行为保持 + 最小差异迁移**”：

- 不借迁移顺手做大规模业务重构。
- 优先保证页面行为与原链路一致。
- 同时把隐式状态和变量作用域收口到更清晰的 setup 组织方式。

### 6. 右键菜单体验优化

- 主要位置：`modules/flowable/components/Process/index.vue`
- 复用能力来源：`customPanel/CustomContextPad.ts`

本轮没有重写 `bpmn-js` 内核，而是采用“轻量入口 + 复用现有动作”的方式处理右键体验：

- 在画布容器上接入 `@contextmenu.capture="handleContextMenu"`
- 新增轻量右键菜单视图与交互状态
- 区分：
  - 画布空白处右键
  - 元素上右键
  - 输入框 / 文本域 / 可编辑区域右键

关键设计原则：

1. 画布和元素右键只作为体验入口，不改建模核心行为。
2. 尽量复用已有 `contextPad`、`bpmn-replace`、`modeling` 能力。
3. 保留输入类区域的原生右键菜单，避免编辑体验退化。

结果是：原先“点开就很奇怪”的右键交互被收敛成更接近正常应用的轻量菜单，同时没有引入大规模样式和行为重写。

### 7. 早期已识别隐患的继续收口

此前仅针对 `Process` 目录识别出的几类真实风险，本轮仍然保持修复结果不回退：

- 共享状态契约不清：统一为 `common/global.ts` 的顶层 `modelerStore`
- 监听器转换依赖未定义变量：收口为纯映射逻辑
- ContextPad 多选删除权限判断失真：修正为真实集合判定
- 保存结果跨源消息外泄面：不再保留 `postMessage('*')`
- 查看器高亮链路空值保护不足：补充空值保护

---

## 当前代码状态结论

### 1. Vue 语法状态

已确认 `modules/flowable/` 下活跃 Vue 文件已统一进入 `<script setup>` 形态。

本轮检索结果显示：

- `modules/flowable/**/*.vue` 中共匹配到 `31` 个 `<script setup>` 文件。
- `modules/flowable/**/*.vue` 中未再检出以下典型 Options API 残留模式：
  - `export default`
  - `defineComponent(...)`
  - `data()`
  - `methods: {}`
  - `created()`
  - `mounted()`
  - `watch: {}`

### 2. Process 目录运行链路状态

已确认 `modules/flowable/components/Process/**/*.js` 当前仅剩：

- `common/packed-config.js`

该文件目前更像历史遗留或打包产物，不属于当前活跃运行链路；本轮继续保持“不制造无意义噪音改动”的处理策略，不做强行迁移。

### 3. 安全与交互收口状态

已确认 `Process` 目录中不再存在 `postMessage(result, '*')` 这类宽泛跨源发送写法。

---

## 验证结论

### 已完成验证

1. `npm run build:prod` 已再次通过。
2. 代码检索确认：
   - `modules/flowable` 下无明显 Options API 残留模式。
   - `Process` 目录仅剩 `common/packed-config.js` 一个 JS 文件。
   - `Process` 目录中无 `postMessage('*')`。
3. 用户已对右键菜单交互进行人工验收，并反馈“没有什么问题”。

### 验证口径说明

本轮“通过”的含义是：

- 代码层改动已完成并可构建。
- 右键菜单已有人机真实使用反馈支撑，不再停留在纯代码自证阶段。

---

## 当前已知限制

### 1. 自动化浏览器验收环境不完整

- Playwright MCP 当前依赖本机 Chrome 可执行文件。
- 该环境里缺少 Playwright 期望路径下的 Chrome，因此无法完成同一路径下的自动化浏览器验收。
- 但本轮该限制已被**人工实测通过**部分替代，不再构成当前交付阻塞。

### 2. LSP 诊断环境缺失

- 当前本地没有可用的 `vue-language-server`。
- 因此本轮不能把 LSP 零诊断作为唯一验收依据。
- 当前通过依据以实际构建、代码检索和人工验收为主。

### 3. 元素能力仍然存在“菜单可见”与“业务闭环成熟”之间的差距

- 前端能展示某些元素，不等于该元素已经在当前项目中具备稳定业务价值。
- 后续若继续扩元素支持，应按“前端建模 -> XML 持久化 -> 后端解析 -> 任务流转/监听器/表单联动”的完整链路逐项验证。

---

## 对后续二次开发的建议

1. 新增设计器能力时，优先沿用现有“常规功能 / 高级功能”分层，不要把所有配置重新堆回单面板。
2. 右键菜单继续保持“轻入口”策略，优先复用现有 `contextPad` 与 `bpmn-replace`，不要演化成第二套建模系统。
3. 新增 BPMN 元素支持时，先确认后端 Flowable7 链路是否真正消费该元素，不要因为前端能画出来就直接开放给业务使用。
4. 后续若继续推进 Flowable 模块维护，建议保持 `<script setup>` 与单文件单职责风格，避免回退到选项式与隐式共享状态混用。

---

## 本轮收口结论

本轮已经完成的，不只是 `Process` 目录局部修补，而是对整个 `modules/flowable/` 做了一次较完整的前端可用性收口：

- 设计器分层更清晰
- 缺失面板已补齐
- 汉化更完整
- 元素可用边界更明确
- 全模块 Vue 写法统一为 `<script setup>`
- 右键菜单体验已完成落地并通过人工验收

在“不新增依赖、不大改 UI、不改后端主链路”的约束下，这一轮已经把 Flowable7 前端模块从“可用但割裂、局部体验粗糙”的状态，推进到“结构更清晰、维护成本更低、体验更稳定”的状态。
