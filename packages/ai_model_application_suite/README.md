# AI Model Application Suite

统一的AI模型管理和聊天收发器套件，集成了AI模型选择器、配置管理和聊天收发功能。

## 功能特性

- 🎯 **统一的AI模型管理** - 支持多种AI提供商的配置管理
- 💬 **聊天收发器** - 支持流式和非流式聊天消息发送
- 🎨 **React组件** - 提供完整的UI组件库
- 🔧 **灵活的存储** - 支持localStorage、API和自定义存储
- 🧪 **完整的测试** - 包含单元测试、集成测试和端到端测试
- 📦 **TypeScript支持** - 完整的类型定义

## 安装

```bash
npm install @ai-model-application-suite/core
```

## 快速开始

### 基本使用

```tsx
import React from 'react';
import { AIModelSelect, createAIModelManager, createAIModelSender } from '@ai-model-application-suite/core';

function App() {
  return (
    <div>
      <h1>AI模型选择器</h1>
      <AIModelSelect 
        mode="select"
        onModelChange={(modelId) => console.log('选中模型:', modelId)}
        onConfigChange={(configs) => console.log('配置变化:', configs)}
      />
    </div>
  );
}
```

### 使用管理器

```tsx
import { createAIModelManager, AIProvider } from '@ai-model-application-suite/core';

// 创建管理器
const manager = createAIModelManager({
  type: 'localStorage',
  localStorageKey: 'my-ai-configs'
});

// 添加配置
const config = {
  id: 'my-config',
  name: '我的OpenAI配置',
  provider: AIProvider.OPENAI,
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  config: {
    apiKey: 'sk-your-api-key',
    model: 'gpt-4'
  }
};

await manager.saveConfig(config);

// 设置选中的模型
await manager.setSelectedModel('my-config');

// 获取选中的模型
const selectedModel = manager.getSelectedModel();
console.log('当前选中的模型:', selectedModel);
```

### 使用聊天收发器

```tsx
import { createAIModelSender, AIProvider } from '@ai-model-application-suite/core';

// 创建发送器
const sender = createAIModelSender({
  id: 'chat-sender',
  name: '聊天发送器',
  provider: AIProvider.VOLCENGINE,
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  config: {
    apiKey: 'your-volcengine-key',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'gpt-4'
  }
});

// 发送聊天消息
const messages = [
  { role: 'user', content: '你好，请介绍一下自己' }
];

const response = await sender.sendChatMessage(messages);
console.log('AI回复:', response.choices[0].message.content);

// 发送流式消息
const streamResponse = await sender.sendChatMessageStream(messages, undefined, (chunk) => {
  console.log('收到流式数据:', chunk);
});
```

## API 参考

### 组件

#### AIModelSelect

AI模型选择器组件，支持下拉选择和列表两种模式。

```tsx
interface AIModelSelectProps {
  mode?: 'select' | 'list';
  selectedModelId?: string;
  onModelChange?: (modelId: string) => void;
  onConfigChange?: (configs: AIModelConfig[]) => void;
  theme?: 'light' | 'dark' | 'system';
  className?: string;
  customClassName?: string;
  style?: React.CSSProperties;
  storage?: StorageConfig;
  supportedProviders?: AIProvider[];
  customProviders?: AIProviderMeta[];
  showAddButton?: boolean;
  addButtonText?: string;
  allowDelete?: boolean;
  placeholder?: string;
  manager?: AIModelManager;
}
```

#### AIModelConfModal

AI模型配置弹窗组件。

```tsx
interface AIModelConfModalProps {
  visible: boolean;
  onClose: () => void;
  editingModel?: AIModelConfig;
  onSave: (config: AIModelConfig) => void;
  supportedProviders: AIProviderMeta[];
  className?: string;
  customClassName?: string;
  style?: React.CSSProperties;
  onShowManager?: () => void;
}
```

#### AIModelManager

AI模型管理器组件。

```tsx
interface AIModelManagerProps {
  visible: boolean;
  onClose: () => void;
  theme?: ThemeMode;
  storage?: StorageConfig;
  supportedProviders?: AIProvider[];
  customProviders?: AIProviderMeta[];
  onConfigChange?: (configs: AIModelConfig[]) => void;
  className?: string;
  customClassName?: string;
  style?: React.CSSProperties;
}
```

### 管理器

#### AIModelManager

AI模型管理器类，提供配置的CRUD操作。

```tsx
class AIModelManager {
  constructor(storage?: StorageConfig);
  
  // 配置管理
  async loadConfigs(): Promise<AIModelConfig[]>;
  async saveConfig(config: AIModelConfig): Promise<AIModelConfig>;
  async deleteConfig(id: string): Promise<void>;
  async updateConfig(id: string, updates: Partial<AIModelConfig>): Promise<AIModelConfig>;
  
  // 选中模型管理
  async setSelectedModel(modelId: string | null): Promise<void>;
  getSelectedModel(): AIModelConfig | null;
  getSelectedModelId(): string | null;
  
  // 配置查询
  getConfigs(): AIModelConfig[];
  getConfigById(id: string): AIModelConfig | null;
  
  // 事件监听
  onChange(callback: (config: AIModelConfig | null) => void): () => void;
  onConfigsChange(callback: (configs: AIModelConfig[]) => void): () => void;
  
  // 生命周期
  async initialize(): Promise<void>;
  destroy(): void;
}
```

### 发送器

#### AIModelSender

AI模型发送器接口，提供聊天和补全功能。

```tsx
interface AIModelSender {
  sendChatMessage(messages: ChatMessage[], options?: SendOptions): Promise<ChatResponse>;
  sendChatMessageStream(messages: ChatMessage[], options?: SendOptions, onUpdate?: (chunk: any) => void): Promise<ChatStreamResponse>;
  sendCompletion(prompt: string, options?: SendOptions): Promise<CompletionResponse>;
  sendCompletionStream(prompt: string, options?: SendOptions): Promise<CompletionStreamResponse>;
}
```

#### AIModelSenderFactory

AI模型发送器工厂，用于创建发送器实例。

```tsx
interface AIModelSenderFactory {
  createSender(config: AIModelConfig): AIModelSender;
  supportsProvider(provider: AIProvider): boolean;
  registerProvider(provider: AIProvider, senderClass: new (config: AIModelConfig) => AIModelSender): void;
  getSupportedProviders(): AIProvider[];
}
```

### 类型定义

#### AIModelConfig

AI模型配置接口。

```tsx
interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  apiKey?: string;
  baseURL?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  config?: {
    apiKey: string;
    baseURL?: string;
    model?: string;
    jsonParams?: string;
    [key: string]: any;
  };
}
```

#### AIProvider

支持的AI提供商枚举。

```tsx
enum AIProvider {
  OPENAI = 'openai',
  OPENAILIKE = 'openailike',
  DEEPSEEK = 'deepseek',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  MISTRAL = 'mistral',
  COHERE = 'cohere',
  AZURE = 'azure',
  OLLAMA = 'ollama',
  VOLCENGINE = 'volcengine',
  CUSTOM = 'custom'
}
```

## 存储配置

支持多种存储方式：

### localStorage存储

```tsx
const storage: StorageConfig = {
  type: 'localStorage',
  localStorageKey: 'my-ai-configs'
};
```

### API存储

```tsx
const storage: StorageConfig = {
  type: 'api',
  api: {
    getConfigs: async () => {
      const response = await fetch('/api/configs');
      return response.json();
    },
    saveConfig: async (config) => {
      const response = await fetch('/api/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return response.json();
    },
    deleteConfig: async (id) => {
      await fetch(`/api/configs/${id}`, { method: 'DELETE' });
    },
    updateConfig: async (id, updates) => {
      const response = await fetch(`/api/configs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return response.json();
    }
  }
};
```

### 自定义存储

```tsx
const storage: StorageConfig = {
  type: 'custom',
  custom: {
    load: () => {
      // 自定义加载逻辑
      return Promise.resolve([]);
    },
    save: (configs) => {
      // 自定义保存逻辑
      return Promise.resolve();
    }
  }
};
```

## 主题定制

支持多种主题和样式定制：

```tsx
// 主题模式
<AIModelSelect theme="dark" />

// 自定义样式类名
<AIModelSelect customClassName="my-custom-theme" />

// 内联样式
<AIModelSelect style={{ backgroundColor: 'red' }} />
```

## 测试

运行测试：

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 运行统一包测试
npm run test:unified
```

## 开发

### 构建

```bash
# 构建库
npm run build:lib

# 开发模式
npm run dev
```

### 代码检查

```bash
npm run lint
```

## 许可证

MIT License
