# Packages

这个目录包含了 React AI Model Selector/Manager 的核心包。

## 包列表

### ai-model-manager

React AI Model Selector/Manager 的核心组件包，包含所有可复用的组件、类型定义和工具函数。

**包含内容：**
- `components/` - React组件
  - `AIModelSelect.tsx` - AI模型选择器组件
  - `AIModelConfModal.tsx` - AI模型配置弹窗组件
  - `AIModelManager.tsx` - AI模型选择器组件
- `types/` - TypeScript类型定义
- `utils/` - 工具函数
  - `providers.ts` - AI提供商配置
  - `storage.ts` - 存储管理
- `styles/` - 样式文件
- `index.ts` - 主入口文件

**构建输出：**
- `dist/` - 构建后的库文件
- `dist/index.js` - CommonJS格式
- `dist/index.esm.js` - ES Module格式
- `dist/index.d.ts` - TypeScript类型定义

## 开发

### 构建库
```bash
npm run build:lib
```

### 类型检查
```bash
npm run lint
```

## 注意事项

- 这是主要的库包，用于发布到npm
- 所有组件都通过 `index.ts` 导出
- 样式文件包含在包中，支持CSS变量自定义
- 使用TypeScript确保类型安全
