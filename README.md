# AI 模型 应用套件（AI Model Application Suite）

这款 AI 模型应用套件基于 TypeScript 开发并以 npm 包形式发布，核心包含 AI 模型选择器与 AI 消息适配器两大模块，能通过统一接口实现与不同 AI 服务商的高效交互，帮助开发者无需单独适配各服务商协议，降低多 AI 服务集成门槛。

[ [Examples](./examples/) ]

## 🚀 核心功能

### AI模型选择器 (AI Model Selector)
- ✨ **无第三方UI依赖**：完全基于原生React和CSS实现
- 🔧 **灵活的存储方式**：支持localStorage、API、自定义存储
- 🎨 **可自定义样式**：提供基础样式并支持CSS变量覆盖
- 🤖 **多AI提供商支持**：内置支持OpenAI、DeepSeek、Anthropic、Google等主流AI服务
- 📱 **响应式设计**：支持移动端和桌面端
- 🔒 **类型安全**：完全使用TypeScript编写
- ⚙️ **配置灵活**：支持自定义提供商和配置字段
- 🔄 **状态持久化**：自动保存选中状态，下次打开时自动选中上次的选择
- 📡 **事件驱动架构**：提供统一的管理器实例，支持多组件共享状态

### 统一AI消息接发器 (Unified AIMessage Transceiver)
- 🔄 **统一接口**：使用相同的API与不同AI服务商交互
- 🚀 **简单易用**：简洁的API设计，快速上手
- 🔌 **可扩展**：支持添加新的AI服务商
- 💬 **消息流**：支持流式响应和普通响应
- 🛡️ **类型安全**：完整的TypeScript类型支持

## 📦 安装

** 注意：尚在自用并优化中，未发布成 npm 包 ** 

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

# 还有更多其他

```

## 🎯 快速开始

### AI模型选择器 - 基础用法

```tsx
import React, { useState } from 'react';
import { AIModelSelect, aiModelSelected } from 'react-ai-model-manager';

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

### AI模型选择器 - 使用统一管理器

```tsx
import React, { useState, useEffect } from 'react';
import { AIModelSelect, aiModelSelected } from 'react-ai-model-manager';
import type { AIModelConfig } from 'react-ai-model-manager/types';

function App() {
  const [selectedModel, setSelectedModel] = useState<AIModelConfig | null>(null);

  useEffect(() => {
    // 监听选择变化（第一次加载也会触发）
    const unsubscribe = aiModelSelected.onChange((config) => {
      setSelectedModel(config);
      console.log('模型选择变化:', config);
    });

    // 初始化管理器
    aiModelSelected.initialize();

    return unsubscribe;
  }, []);

  return (
    <div>
      <AIModelSelect
        mode="select"
        placeholder="请选择AI模型"
        manager={aiModelSelected}
      />
      
      {selectedModel && (
        <div>
          <h3>当前选中的模型:</h3>
          <p>名称: {selectedModel.name}</p>
          <p>提供商: {selectedModel.provider}</p>
        </div>
      )}
    </div>
  );
}
```

### 统一AI消息接发器 - 基础用法

```tsx
import { createAIModelSender } from 'react-ai-model-manager';

// 创建发送器实例
const sender = createAIModelSender({
  provider: 'volcengine', // AI服务商
  config: {
    apiKey: 'your-api-key',
    // 其他配置...
  }
});

// 发送消息
const response = await sender.sendMessage({
  messages: [
    { role: 'user', content: '你好，请介绍一下自己' }
  ]
});

console.log(response.content);
```

### 统一AI消息接发器 - 流式响应

```tsx
// 流式响应
const stream = await sender.sendMessageStream({
  messages: [
    { role: 'user', content: '请写一个关于春天的诗' }
  ]
});

for await (const chunk of stream) {
  if (chunk.type === 'content') {
    process.stdout.write(chunk.content);
  } else if (chunk.type === 'done') {
    console.log('\n完成');
  }
}
```

## 📚 详细使用指南

### AI模型选择器 - 高级配置

[详细文档](./examples/AIModelSelector/README.md)

#### 自定义存储方式

```tsx
import React from 'react';
import { AIModelSelect, createAIModelManager } from 'react-ai-model-manager';
import type { StorageConfig } from 'react-ai-model-manager/types';

function CustomStorageExample() {
  // 创建自定义管理器实例
  const customManager = createAIModelManager({
    type: 'localStorage',
    localStorageKey: 'my-custom-configs'
  });

  useEffect(() => {
    // 监听配置列表变化
    const unsubscribe = customManager.onConfigsChange((configs) => {
      console.log('配置列表变化:', configs);
    });

    customManager.initialize();
    return unsubscribe;
  }, []);

  return (
    <AIModelSelect
      mode="list"
      manager={customManager}
      showAddButton={true}
      addButtonText="添加新模型"
    />
  );
}
```

#### API存储方式

```tsx
import React from 'react';
import { AIModelSelect, createAIModelManager } from 'react-ai-model-manager';
import type { StorageConfig } from 'react-ai-model-manager/types';

function APIStorageExample() {
  const apiStorageConfig: StorageConfig = {
    type: 'api',
    api: {
      getConfigs: () => fetch('/api/configs').then(r => r.json()),
      saveConfig: (config) => fetch('/api/configs', { 
        method: 'POST', 
        body: JSON.stringify(config) 
      }),
      deleteConfig: (id) => fetch(`/api/configs/${id}`, { 
        method: 'DELETE' 
      })
    }
  };

  const apiManager = createAIModelManager(apiStorageConfig);

  return (
    <AIModelSelect
      mode="select"
      manager={apiManager}
      placeholder="从API加载的模型"
    />
  );
}
```

### 统一AI消息接发器 - 高级功能

[详细文档](./examples/UnifiedAIChatTransceiver/README.md)

#### 多轮对话

```tsx
// 多轮对话
const conversation = [
  { role: 'user', content: '你好' },
  { role: 'assistant', content: '你好！有什么可以帮助你的吗？' },
  { role: 'user', content: '请介绍一下机器学习' }
];

const response = await sender.sendMessage({
  messages: conversation
});

console.log('AI回复:', response.content);
```

#### 自定义参数

```tsx
const response = await sender.sendMessage({
  messages: [
    { role: 'user', content: '请写一个故事' }
  ],
  options: {
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9
  }
});
```

#### 错误处理

```tsx
try {
  const response = await sender.sendMessage({
    messages: [
      { role: 'user', content: '测试消息' }
    ]
  });
} catch (error) {
  if (error.code === 'RATE_LIMIT') {
    console.log('请求频率过高，请稍后重试');
  } else if (error.code === 'INVALID_API_KEY') {
    console.log('API密钥无效');
  } else {
    console.log('发送失败:', error.message);
  }
}
```

## 🎨 主题和样式配置

### 主题模式

```tsx
import React from 'react';
import { AIModelSelect } from 'react-ai-model-manager';

function ThemeExample() {
  return (
    <div>
      {/* 亮色主题 */}
      <AIModelSelect
        mode="select"
        theme="light"
        placeholder="亮色主题"
      />
      
      {/* 暗色主题 */}
      <AIModelSelect
        mode="list"
        theme="dark"
        placeholder="暗色主题"
      />
      
      {/* 系统自动 */}
      <AIModelSelect
        mode="select"
        theme="system"
        placeholder="系统自动"
      />
    </div>
  );
}
```

### 自定义样式

```tsx
import React from 'react';
import { AIModelSelect } from 'react-ai-model-manager';

function CustomStyleExample() {
  return (
    <AIModelSelect
      mode="list"
      className="my-custom-class"
      customClassName="color-blue size-large rounded-lg"
      style={{
        minWidth: '300px',
        border: '2px solid #e2e8f0'
      }}
      primaryColorStyles={{
        primary: '#8b5cf6',
        primaryHover: '#7c3aed',
        primaryLight: 'rgba(139, 92, 246, 0.1)',
        primaryGlow: 'rgba(139, 92, 246, 0.3)'
      }}
    />
  );
}
```

## 🔧 支持的服务商

### AI模型选择器支持的服务商

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

### AI消息适配器支持的服务商

#### Volcengine (火山引擎)

```tsx
const sender = createAIModelSender({
  provider: 'volcengine',
  config: {
    apiKey: 'your-volcengine-key',
    region: 'cn-beijing', // 可选
    model: 'deepseek-v3.1' // 可选，默认模型
  }
});
```

#### OpenAI

```tsx
const sender = createAIModelSender({
  provider: 'openai',
  config: {
    apiKey: 'your-openai-key',
    baseURL: 'https://api.openai.com/v1', // 可选
    model: 'gpt-4' // 可选，默认模型
  }
});
```

## 📖 API 参考

### AI模型选择器 API

#### AIModelSelect Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mode` | `'select' \| 'list'` | `'select'` | 显示模式 |
| `selectedModelId` | `string` | `undefined` | 当前选中的模型ID |
| `onModelChange` | `(modelId: string) => void` | `undefined` | 模型选择变化回调 |
| `onConfigChange` | `(configs: AIModelConfig[]) => void` | `undefined` | 配置列表变化回调 |
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | 主题模式 |
| `className` | `string` | `''` | 自定义CSS类名 |
| `customClassName` | `string` | `''` | 自定义样式类名 |
| `style` | `React.CSSProperties` | `undefined` | 内联样式 |
| `storage` | `StorageConfig` | `undefined` | 存储配置 |
| `supportedProviders` | `AIProvider[]` | `[OPENAI, DEEPSEEK, ...]` | 支持的提供商 |
| `customProviders` | `AIProviderMeta[]` | `[]` | 自定义提供商 |
| `showAddButton` | `boolean` | `true` | 是否显示添加按钮 |
| `addButtonText` | `string` | `'添加AI模型'` | 添加按钮文本 |
| `allowDelete` | `boolean` | `true` | 是否允许删除 |
| `placeholder` | `string` | `'请选择AI模型'` | 占位符文本 |
| `manager` | `AIModelManager` | `undefined` | 管理器实例 |

#### aiModelSelected 方法

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `onChange(callback)` | `(config: AIModelConfig \| null) => void` | `() => void` | 监听选择变化 |
| `onConfigsChange(callback)` | `(configs: AIModelConfig[]) => void` | `() => void` | 监听配置列表变化 |
| `getSelectedModel()` | 无 | `AIModelConfig \| null` | 获取当前选中的模型 |
| `getSelectedModelId()` | 无 | `string \| null` | 获取当前选中的模型ID |
| `getConfigs()` | 无 | `AIModelConfig[]` | 获取所有配置 |
| `getConfigById(id)` | `string` | `AIModelConfig \| null` | 根据ID获取配置 |
| `setSelectedModel(modelId)` | `string \| null` | `Promise<void>` | 设置选中的模型 |
| `saveConfig(config)` | `AIModelConfig` | `Promise<AIModelConfig>` | 保存配置 |
| `deleteConfig(id)` | `string` | `Promise<void>` | 删除配置 |
| `updateConfig(id, updates)` | `string, Partial<AIModelConfig>` | `Promise<AIModelConfig>` | 更新配置 |
| `initialize()` | 无 | `Promise<void>` | 初始化管理器 |
| `destroy()` | 无 | `void` | 销毁管理器 |

### AI消息适配器 API

#### 核心接口

#### `createAIModelSender(config)`

创建AI消息发送器实例。

**参数:**
- `config.provider`: 服务商名称
- `config.config`: 服务商配置

**返回:** `AIModelSender` 实例

#### `sender.sendMessage(request)`

发送消息并获取回复。

**参数:**
- `request.messages`: 消息数组
- `request.options`: 可选参数 (temperature, maxTokens等)

**返回:** `Promise<SendMessageResponse>`

#### `sender.sendMessageStream(request)`

发送消息并获取流式回复。

**参数:**
- `request.messages`: 消息数组
- `request.options`: 可选参数

**返回:** `Promise<AsyncIterable<ChatStreamResponse>>`

### 类型定义

```typescript
interface SendMessageRequest {
  messages: Message[];
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    [key: string]: any;
  };
}

interface SendMessageResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatStreamResponse {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
}

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

## 🎯 最佳实践

### AI模型选择器最佳实践

#### 1. 错误处理

```tsx
const sendMessageWithRetry = async (sender: AIModelSender, request: SendMessageRequest, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await sender.sendMessage(request);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

#### 2. 消息管理

```tsx
class ConversationManager {
  private messages: Message[] = [];

  addMessage(role: 'user' | 'assistant', content: string) {
    this.messages.push({ role, content });
  }

  async sendMessage(sender: AIModelSender, content: string) {
    this.addMessage('user', content);
    
    const response = await sender.sendMessage({
      messages: this.messages
    });
    
    this.addMessage('assistant', response.content);
    return response;
  }

  clear() {
    this.messages = [];
  }
}
```

### 注意事项

1. **选中状态持久化**: 选中状态会自动保存到 localStorage，key 为 `{localStorageKey}-selected`
2. **管理器实例**: 管理器实例是单例的，多个组件可以共享同一个实例
3. **内存泄漏**: 记得在组件卸载时取消订阅回调，避免内存泄漏
4. **初始化**: 使用前需要调用 `initialize()` 方法
5. **命名规范**: 使用小写字母开头的命名，避免与React组件冲突
6. **存储方式**: 支持localStorage、API、自定义存储方式
7. **事件驱动**: 基于事件回调的设计，支持多个组件共享同一个管理器实例

## 🚀 演示应用

项目包含完整的演示应用，展示组件的各种功能和用法。

### 运行演示

```bash
# AI模型选择器演示
cd examples/AIModelSelector && npm install && npm run dev

# AI消息适配器演示
cd examples/AIModelSender && npm install && npm run dev
```

### 演示特性

- 🌖 亮色主题演示
- 🌙 暗色主题演示
- 📱 下拉选择模式
- 📋 列表模式
- 🎨 自定义样式配置
- 💾 多种存储方式（LocalStorage、API模拟）
- ⚙️ AI模型配置管理
- 🔄 选中状态持久化
- 📡 事件驱动架构
- 💬 消息流式响应
- 🛡️ 错误处理演示

## 🛠️ 开发

### 项目结构

```
packages/
├── ai-model-manager/     # AI模型选择器
│   ├── components/       # React组件
│   ├── types/           # TypeScript类型定义
│   ├── utils/           # 工具函数
│   └── styles/          # 样式文件
├── unified-AI-chat-transceiver/      # AI消息适配器
│   ├── src/             # 源代码
│   ├── types/           # TypeScript类型定义
│   └── providers/       # AI服务商实现
examples/
├── AIModelSelector/     # AI模型选择器演示
└── AIModelSender/       # AI消息适配器演示
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

1. 在`packages/ai-model-manager/types/index.ts`中添加新的提供商枚举值
2. 在`packages/ai-model-manager/utils/providers.ts`中添加提供商元数据配置
3. 在`packages/unified-AI-chat-transceiver/src/providers/`中添加新的服务商实现
4. 更新文档和类型定义

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📝 更新日志

- 初始版本发布
- 支持主流AI提供商
- 提供localStorage和API存储方式
- 响应式设计和自定义主题支持
- AI模型选择器状态持久化
- AI消息适配器统一接口
- 流式响应支持

## todo

- 思维链
