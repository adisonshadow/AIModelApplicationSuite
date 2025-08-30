# React AI Model Manager

一个用于在界面上协助配置和选择AI模型的React组件包。

## 特性

- ✨ **无第三方UI依赖**：完全基于原生React和CSS实现
- 🔧 **灵活的存储方式**：支持localStorage、API、自定义存储
- 🎨 **可自定义样式**：提供基础样式并支持CSS变量覆盖
- 🤖 **多AI提供商支持**：内置支持OpenAI、DeepSeek、Anthropic、Google等主流AI服务
- 📱 **响应式设计**：支持移动端和桌面端
- 🔒 **类型安全**：完全使用TypeScript编写
- ⚙️ **配置灵活**：支持自定义提供商和配置字段

## 安装

```bash
npm install react-ai-model-manager
# 或
yarn add react-ai-model-manager
```

### Peer Dependencies

需要安装以下peer dependencies：

```bash
npm install react react-dom
# 或
yarn add react react-dom
```

### AI SDK依赖（可选）

根据需要安装对应的AI SDK：

```bash
# OpenAI
npm install @ai-sdk/openai

# DeepSeek
npm install @ai-sdk/deepseek

# Anthropic
npm install @ai-sdk/anthropic

# Google
npm install @ai-sdk/google

# Mistral
npm install @ai-sdk/mistral

# Cohere
npm install @ai-sdk/cohere

# Azure OpenAI
npm install @ai-sdk/azure

# Ollama
npm install ollama
```

## 快速开始

### 基础用法

```tsx
import React, { useState } from 'react';
import { AIModelSelect, AIProvider } from 'react-ai-model-manager';

function App() {
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  
  return (
    <AIModelSelect
      selectedModelId={selectedModelId}
      onModelChange={setSelectedModelId}
      supportedProviders={[
        AIProvider.OPENAI,
        AIProvider.DEEPSEEK,
        AIProvider.ANTHROPIC
      ]}
    />
  );
}
```

### 使用API存储

```tsx
import React from 'react';
import { AIModelSelect, StorageConfig, AIModelConfig } from 'react-ai-model-manager';

const apiStorage: StorageConfig = {
  type: 'api',
  api: {
    getConfigs: async () => {
      const response = await fetch('/api/ai-models');
      return response.json();
    },
    saveConfig: async (config: AIModelConfig) => {
      const response = await fetch('/api/ai-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return response.json();
    },
    deleteConfig: async (id: string) => {
      await fetch(`/api/ai-models/${id}`, { method: 'DELETE' });
    },
    updateConfig: async (id: string, updates: Partial<AIModelConfig>) => {
      const response = await fetch(`/api/ai-models/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return response.json();
    }
  }
};

function App() {
  return (
    <AIModelSelect
      storage={apiStorage}
      onModelChange={(modelId) => console.log('Selected:', modelId)}
    />
  );
}
```

### 自定义样式

```tsx
import React from 'react';
import { AIModelSelect } from 'react-ai-model-manager';

function App() {
  return (
    <div>
      {/* 使用CSS变量自定义 */}
      <style>{`
        .custom-ai-manager {
          --primary-color: #8b5cf6;
          --primary-hover: #7c3aed;
          --border-color: #c4b5fd;
          --bg-secondary: #f3f4f6;
        }
      `}</style>
      
      <AIModelSelect
        className="custom-ai-manager"
        style={{ maxWidth: '400px' }}
      />
    </div>
  );
}
```

### 自定义提供商

```tsx
import React from 'react';
import { AIModelSelect, AIProvider, AIProviderMeta } from 'react-ai-model-manager';

const customProviders: AIProviderMeta[] = [
  {
    id: AIProvider.CUSTOM,
    name: '自定义AI服务',
    description: '我的自定义AI服务',
    requiresApiKey: true,
    configFields: [
      {
        key: 'apiKey',
        label: 'API密钥',
        type: 'password',
        required: true,
        placeholder: '输入您的API密钥'
      },
      {
        key: 'endpoint',
        label: '服务端点',
        type: 'url',
        required: true,
        placeholder: 'https://api.example.com'
      }
    ]
  }
];

function App() {
  return (
    <AIModelSelect
      supportedProviders={[AIProvider.CUSTOM]}
      customProviders={customProviders}
    />
  );
}
```

## 演示应用

项目包含一个完整的演示应用，展示组件的各种功能和用法。

### 运行演示

```bash
# 安装demo依赖
cd examples/AIModelSelector && npm install

# 启动演示应用
npm run demo

# 带文件监听的开发模式
npm run demo:watch

# 构建演示应用
npm run demo:build
```

### 演示特性

- 🌖 亮色主题演示
- 🌙 暗色主题演示
- 📱 下拉选择模式
- 📋 列表模式
- 🎨 自定义样式配置
- 💾 多种存储方式（LocalStorage、API模拟）
- ⚙️ AI模型配置管理

## API Reference

### AIModelSelect Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| selectedModelId | string | undefined | 当前选中的模型ID |
| onModelChange | (modelId: string) => void | undefined | 模型选择变化回调 |
| onConfigChange | (configs: AIModelConfig[]) => void | undefined | 配置变化回调 |
| className | string | '' | 自定义CSS类名 |
| style | React.CSSProperties | undefined | 内联样式 |
| storage | StorageConfig | localStorage配置 | 数据存储配置 |
| supportedProviders | AIProvider[] | 默认提供商列表 | 支持的AI提供商 |
| customProviders | AIProviderMeta[] | [] | 自定义提供商配置 |
| showAddButton | boolean | true | 是否显示添加按钮 |
| addButtonText | string | '添加AI模型' | 添加按钮文本 |
| allowDelete | boolean | true | 是否允许删除模型 |

### StorageConfig

```typescript
interface StorageConfig {
  type: 'localStorage' | 'api' | 'custom';
  localStorageKey?: string;
  api?: {
    getConfigs: () => Promise<AIModelConfig[]>;
    saveConfig: (config: AIModelConfig) => Promise<AIModelConfig>;
    deleteConfig: (id: string) => Promise<void>;
    updateConfig: (id: string, config: Partial<AIModelConfig>) => Promise<AIModelConfig>;
  };
  custom?: {
    load: () => Promise<AIModelConfig[]> | AIModelConfig[];
    save: (configs: AIModelConfig[]) => Promise<void> | void;
  };
}
```

### AIModelConfig

```typescript
interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  apiKey?: string;
  baseURL?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  config?: Record<string, any>;
}
```

### 支持的AI提供商

| 提供商 | 枚举值 | NPM包 | 描述 |
|--------|--------|-------|------|
| OpenAI | AIProvider.OPENAI | @ai-sdk/openai | OpenAI GPT模型 |
| DeepSeek | AIProvider.DEEPSEEK | @ai-sdk/deepseek | DeepSeek AI模型 |
| Anthropic | AIProvider.ANTHROPIC | @ai-sdk/anthropic | Anthropic Claude模型 |
| Google | AIProvider.GOOGLE | @ai-sdk/google | Google Gemini模型 |
| Mistral | AIProvider.MISTRAL | @ai-sdk/mistral | Mistral AI模型 |
| Cohere | AIProvider.COHERE | @ai-sdk/cohere | Cohere AI模型 |
| Azure | AIProvider.AZURE | @ai-sdk/azure | Azure OpenAI服务 |
| Ollama | AIProvider.OLLAMA | ollama | 本地Ollama模型 |

## 样式自定义

### 主题系统

组件支持两层主题系统：

1. **主题模式** (`theme` 参数)：控制整体的亮色/暗色模式
   - `light`：亮色模式
   - `dark`：暗色模式
   - `system`：根据系统偏好自动切换

2. **主色调** (CSS 类名)：控制组件的主色调方案
   - `color-blue`：蓝色主色调
   - `color-purple`：紫色主色调
   - `color-green`：绿色主色调
   - `color-orange`：橙色主色调
   - `color-red`：红色主色调

```tsx
// 同时使用主题模式和主色调
<AIModelSelect
  theme="dark"  // 暗色模式
  className="color-purple"  // 紫色主色调
  // ... 其他属性
/>
```

### CSS变量

组件使用CSS变量来定义主题，您可以通过覆盖这些变量来自定义外观：

```css
.ai-model-manager {
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  --secondary-color: #64748b;
  --success-color: #10b981;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  --border-color: #e2e8f0;
  --bg-color: #ffffff;
  --bg-secondary: #f8fafc;
  --text-color: #1e293b;
  --text-secondary: #64748b;
  --border-radius: 6px;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --transition: all 0.2s ease-in-out;
}
```

### 暗色主题

组件自动支持暗色主题，可以通过设置`auto-theme`类名启用：

```tsx
<AIModelSelect className="auto-theme" />
```

## 开发

### 项目结构

```
src/
├── components/          # React组件
│   ├── AIModelSelect.tsx
│   └── AIModelConfModal.tsx
├── types/              # TypeScript类型定义
│   └── index.ts
├── utils/              # 工具函数
│   ├── providers.ts    # AI提供商配置
│   └── storage.ts      # 存储管理
├── styles/             # 样式文件
│   └── index.css
├── demo/               # 演示应用
│   ├── App.tsx
│   └── main.tsx
└── index.ts            # 主入口文件
```

### 本地开发

```bash
# 克隆项目
git clone <repository-url>
cd react-ai-model-manager

# 安装依赖
yarn install

# 启动开发服务器
yarn dev

# 构建库文件
yarn build:lib

# 构建演示应用
yarn build
```

### 添加新的AI提供商

1. 在`src/types/index.ts`中添加新的提供商枚举值
2. 在`src/utils/providers.ts`中添加提供商元数据配置
3. 更新文档和类型定义

## 许可证

MIT

## 贡献

欢迎提交Issue和Pull Request！

## 更新日志

### 1.0.0

- 初始版本发布
- 支持主流AI提供商
- 提供localStorage和API存储方式
- 响应式设计和自定义主题支持