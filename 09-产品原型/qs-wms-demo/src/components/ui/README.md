# components/ui

这里是 shadcn/ui 生成的基础组件，保持上游的写法（双引号、`cn` 直接来自 `cn` 包），并整体不参与
`scripts/lint-design.mjs` 的设计检查。

约定：

- 页面和业务组件优先使用 `components/biz` 的封装；不要为了一个页面改 `ui`。
- 必须修 `ui` 的上游默认值（例如字号、日历语言、焦点样式）时，改动要小，并在提交说明里写清原因。
- 新增 shadcn 组件后跑一次 `npm run check`，确认它没有把未使用文件带进来。
