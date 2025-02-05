## 简介
从零开始的 React18 的实现，能够跑通官方的测试用例。
## 实现功能
- 实现最为主要的render及commit阶段，对函数式组件、类组件和 Fragment 都有支持。
- 添加对 hooks 的支持，主要有 useState、useEffect、useRef、useTransition 和 useContext。
- 使用 Jest 对部分功能进行了单元测试，测试用例来自官方。
- 实现了 noopRender 包，与宿主环境无关的渲染器。
- 接入了 React-Scheduler 及 Lane 模型，对事件的优先级进行处理，实现 concurrent 模式下的并发更新。
