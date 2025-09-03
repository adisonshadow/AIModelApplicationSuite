# AI 模型 应用套件（AI Model Application Suite）演示

这是 React AI Model Selector/Manager 组件 和 Unified AIMessage Transceiver 组件的 演示应用。

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 带文件监听的开发模式
```bash
npm run dev:watch
```

### 构建演示应用
```bash
npm run build
```

## 功能特性

- 🌖 亮色主题演示
- 🌙 暗色主题演示
- 📱 下拉选择模式
- 📋 列表模式
- 🎨 自定义样式配置
- 💾 多种存储方式（LocalStorage、API模拟）
- ⚙️ AI模型配置管理

## 文件结构

- `App.tsx` - 主演示应用
- `main.tsx` - 应用入口
- `package.json` - 演示应用依赖
- `vite.config.ts` - Vite配置
- `tsconfig.json` - TypeScript配置
- `nodemon.json` - 文件监听配置

## 注意事项

- 这是一个独立的演示应用，有自己的依赖管理
- 通过 `../../packages/ai-model-manager` 和 `../../packages/unified-AI-chat-transceiver` 路径引用主库的组件和类型
- 构建输出到 `../../examples-dist` 目录
