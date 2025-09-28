<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18">  中文 ｜ [English](./README.md)

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

<img src="https://raw.githubusercontent.com/adisonshadow/AIModelApplicationSuite/main/Screenshots/s1.png" width="1024" />

<img src="https://raw.githubusercontent.com/adisonshadow/AIModelApplicationSuite/main/Screenshots/s2.png" width="400" />

<img src="https://raw.githubusercontent.com/adisonshadow/AIModelApplicationSuite/main/Screenshots/s3.png" width="600" />

### 统一AI消息接发器 (Unified AIMessage Transceiver)
- 🔄 **统一接口**：使用相同的API与不同AI服务商交互
- 🚀 **简单易用**：简洁的API设计，快速上手
- 🔌 **可扩展**：支持添加新的AI服务商
- 💬 **消息流**：支持流式响应和普通响应
- 🛡️ **类型安全**：完整的TypeScript类型支持
- 🔄 **自动继续**：智能检测响应中断，自动请求继续并合并内容，支持去重复合成
- 📝 **代码块优化**：支持代码块自动换行，解决宽度失控问题，提供更好的代码阅读体验

<img src="https://raw.githubusercontent.com/adisonshadow/AIModelApplicationSuite/main/Screenshots/u1.png" width="1024" />

<img src="https://raw.githubusercontent.com/adisonshadow/AIModelApplicationSuite/main/Screenshots/u2.png" width="800" />

## 📦 安装

** 注意：尚在自用并优化中，未发布成 npm 包 ** 

```bash
npm install ai-model-application-suite
# 或
yarn add ai-model-application-suite
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

### 🆕 新API使用方式 (v0.0.3 推荐)

#### 使用React Hook - 最简单的方式

```tsx
import React from 'react';
import { useAIModel, useAIEvents } from 'ai-model-application-suite';

function App() {
  // 获取AI模型状态和操作
  const { 
    currentModel, 
    configs, 
    setCurrentModel, 
    addConfig 
  } = useAIModel();

  // 获取AI事件状态和操作
  const { 
    startConversation, 
    stopConversation, 
    sendMessage 
  } = useAIEvents();

  return (
    <div>
      <h3>当前模型: {currentModel?.name || '无'}</h3>
      <button onClick={() => startConversation()}>开始对话</button>
      <button onClick={() => sendMessage('你好')}>发送消息</button>
    </div>
  );
}
```

#### 使用全局管理器 - 更灵活的方式

```tsx
import React, { useEffect } from 'react';
import { globalAIModelManager, aiEventManager } from 'ai-model-application-suite';

function App() {
  useEffect(() => {
    // 初始化管理器
    globalAIModelManager.initialize();
    
    // 监听模型选择变化
    const unsubscribe = globalAIModelManager.subscribe('modelSelected', (event) => {
      console.log('模型选择变化:', event.data);
    });
    
    return unsubscribe;
  }, []);

  return <div>使用全局管理器</div>;
}
```

### AI模型选择器 - 基础用法

```tsx
import React from 'react';
import { AIModelSelect, useAIModel, AIProvider } from 'ai-model-application-suite';

function App() {
  const { currentModelId, setCurrentModel, configs } = useAIModel();
  
  return (
    <AIModelSelect
      selectedModelId={currentModelId}
      onModelChange={setCurrentModel}
      supportedProviders={[
        AIProvider.OPENAI,
        AIProvider.DEEPSEEK,
        AIProvider.ANTHROPIC
      ]}
      storage={{
        type: 'localStorage',
        localStorageKey: 'ai-model-configs'
      }}
    />
  );
}
```

### AI模型选择器 - 自定义选项格式

```tsx
import React from 'react';
import { AIModelSelect, useAIModel, AIProvider } from 'ai-model-application-suite';

function App() {
  const { currentModelId, setCurrentModel } = useAIModel();
  
  return (
    <AIModelSelect
      selectedModelId={currentModelId}
      onModelChange={setCurrentModel}
      supportedProviders={[
        AIProvider.OPENAI,
        AIProvider.DEEPSEEK,
        AIProvider.ANTHROPIC
      ]}
      formatLabel={(config) => config.name} // 只显示配置名称
      storage={{
        type: 'localStorage',
        localStorageKey: 'ai-model-configs'
      }}
    />
  );
}
```

### AI模型选择器 - 使用全局管理器

```tsx
import React, { useEffect } from 'react';
import { AIModelSelect, getGlobalAIModelManager } from 'ai-model-application-suite';
import type { AIModelConfig } from 'ai-model-application-suite/types';

function App() {
  useEffect(() => {
    const manager = getGlobalAIModelManager({
      type: 'localStorage',
      localStorageKey: 'ai-model-configs'
    });

    // 监听选择变化
    const unsubscribe = manager.subscribe('modelSelected', (event) => {
      console.log('模型选择变化:', event.data);
    });

    // 初始化管理器
    manager.initialize();

    return unsubscribe;
  }, []);

  return (
    <div>
      <AIModelSelect
        mode="select"
        placeholder="请选择AI模型"
        storage={{
          type: 'localStorage',
          localStorageKey: 'ai-model-configs'
        }}
      />
    </div>
  );
}
```

### 统一AI消息接发器 - 基础用法

```tsx
import { createAIModelSender } from 'ai-model-application-suite';

// 创建发送器实例
const sender = createAIModelSender({
  provider: 'volcengine', // AI服务商
  config: {
    apiKey: 'your-api-key',
    // 其他配置...
  }
});

// 发送消息
const response = await sender.sendChatMessage([
  { role: 'user', content: '你好，请介绍一下自己' }
]);

console.log(response.choices[0].message.content);
```

### 统一AI消息接发器 - 自动继续功能

```tsx
import { createAIModelSender } from 'ai-model-application-suite';

const sender = createAIModelSender(config);

// 启用自动继续功能
const response = await sender.sendChatMessage([
  { role: 'user', content: '请详细解释人工智能的发展历史，包括各个重要阶段和里程碑事件。' }
], {
  autoContinue: true,        // 启用自动继续
  maxAutoContinue: 3,        // 最大自动继续次数
  maxTokens: 500,            // 故意设置较小的token限制来测试自动继续
  temperature: 0.7
});

console.log('最终内容:', response.choices[0].message.content);
console.log('自动继续状态:', response.autoContinueState);

// 流式响应也支持自动继续
const streamResponse = await sender.sendChatMessageStream([
  { role: 'user', content: '请写一篇关于春天的长文章' }
], {
  autoContinue: true,
  maxAutoContinue: 2,
  maxTokens: 300
}, (chunk) => {
  // 实时处理流式数据
  console.log('流式数据:', chunk);
});
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
import { AIModelSelect, useAIModel } from 'ai-model-application-suite';
import type { StorageConfig } from 'ai-model-application-suite/types';

function CustomStorageExample() {
  const { configs, addConfig } = useAIModel({
    type: 'localStorage',
    localStorageKey: 'my-custom-configs'
  });

  return (
    <AIModelSelect
      mode="list"
      storage={{
        type: 'localStorage',
        localStorageKey: 'my-custom-configs'
      }}
      showAddButton={true}
      addButtonText="添加新模型"
      onConfigChange={(newConfigs) => {
        console.log('配置列表变化:', newConfigs);
      }}
    />
  );
}
```

#### API存储方式

```tsx
import React from 'react';
import { AIModelSelect, useAIModel } from 'ai-model-application-suite';
import type { StorageConfig } from 'ai-model-application-suite/types';

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

  const { configs, loading } = useAIModel(apiStorageConfig);

  return (
    <AIModelSelect
      mode="select"
      storage={apiStorageConfig}
      placeholder="从API加载的模型"
    />
  );
}
```

### 统一AI消息接发器 - 高级功能

[详细文档](./examples/UnifiedAIChatTransceiver/README.md)

#### 自动继续功能详解

自动继续功能是v0.0.3版本的重要特性，专门解决AI响应因长度限制中断的问题。

**核心特性：**
- 🎯 **智能中断检测**：自动识别因token限制导致的响应中断
- 🔄 **自动继续请求**：智能生成继续请求，确保内容完整性
- 🧩 **去重复合成**：自动检测并合并重复内容片段
- 📊 **状态跟踪**：提供详细的自动继续状态信息

**工作原理：**
1. 检测 `finishReason` 为 `"length"` 的情况
2. 分析内容是否看起来被截断（以...、逗号、冒号等结尾）
3. 自动生成继续请求："请继续完成上述回答，从上次中断的地方继续。"
4. 循环执行直到响应完成或达到最大尝试次数
5. 智能合并多个响应片段，去除重复内容

**使用示例：**

```tsx
import { createAIModelSender } from 'ai-model-application-suite';

const sender = createAIModelSender(config);

// 基础自动继续
const response = await sender.sendChatMessage([
  { role: 'user', content: '请详细解释量子计算原理，包括量子比特、量子门、量子算法等，不少于3000字。' }
], {
  autoContinue: true,        // 启用自动继续
  maxAutoContinue: 3,        // 最大自动继续次数
  maxTokens: 800,            // 故意设置较小的token限制
  temperature: 0.7
});

console.log('最终内容长度:', response.choices[0].message.content.length);
console.log('自动继续状态:', response.autoContinueState);

// 流式响应自动继续
const streamResponse = await sender.sendChatMessageStream([
  { role: 'user', content: '请写一篇关于人工智能发展史的详细文章' }
], {
  autoContinue: true,
  maxAutoContinue: 2,
  maxTokens: 500
}, (chunk) => {
  // 实时处理流式数据
  console.log('收到数据:', chunk.choices?.[0]?.delta?.content);
});

// 检查自动继续状态
if (streamResponse.autoContinueState) {
  console.log('自动继续次数:', streamResponse.autoContinueState.currentAttempt);
  console.log('是否中断:', streamResponse.autoContinueState.isInterrupted);
}
```

**配置选项：**
- `autoContinue`: 是否启用自动继续功能
- `maxAutoContinue`: 最大自动继续次数，防止无限循环（默认3次）
- `maxTokens`: 单次请求的最大token数，建议设置较小值来测试自动继续

**最佳实践：**
1. 对于需要长文本回答的场景，建议启用自动继续
2. 设置合适的 `maxAutoContinue` 值，避免无限循环
3. 监控 `autoContinueState` 了解自动继续的执行情况
4. 在UI中显示自动继续状态，提升用户体验

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
import { AIModelSelect } from 'ai-model-application-suite';

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
import { AIModelSelect } from 'ai-model-application-suite';

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

### 🆕 新API参考 (v0.0.3)

#### React Hooks

##### `useAIModel(storage?: StorageConfig)`

主要的AI模型Hook，提供完整的模型管理功能。

**返回值:**
- `currentModel`: 当前选中的模型配置
- `currentModelId`: 当前选中的模型ID
- `configs`: 所有配置列表
- `loading`: 加载状态
- `error`: 错误信息
- `isReady`: 是否已初始化
- `setCurrentModel`: 设置当前模型
- `addConfig`: 添加配置
- `updateConfig`: 更新配置
- `deleteConfig`: 删除配置
- `getConfigById`: 根据ID获取配置
- `subscribe`: 订阅事件
- `setErrorHandler`: 设置错误处理器

##### `useCurrentAIModel(storage?: StorageConfig)`

简化的Hook，只获取当前模型信息。

**返回值:**
- `currentModel`: 当前选中的模型配置
- `currentModelId`: 当前选中的模型ID
- `loading`: 加载状态
- `error`: 错误信息

##### `useAIEvents()`

AI事件管理Hook，提供对话和流式响应管理。

**返回值:**
- `currentConversation`: 当前对话状态
- `conversations`: 所有对话列表
- `stats`: 对话统计信息
- `startConversation`: 开始新对话
- `stopConversation`: 停止当前对话
- `clearConversation`: 清除对话
- `sendMessage`: 发送消息
- `receiveMessage`: 接收消息
- `startStream`: 开始流式响应
- `stopStream`: 停止流式响应
- `handleError`: 处理错误
- `subscribe`: 订阅事件

##### `useConversation()`

简化的对话管理Hook。

**返回值:**
- `currentConversation`: 当前对话状态
- `isActive`: 是否活跃
- `isStreaming`: 是否流式响应
- `messageCount`: 消息数量
- `startConversation`: 开始对话
- `stopConversation`: 停止对话
- `clearConversation`: 清除对话

##### `useStreaming()`

流式响应管理Hook。

**返回值:**
- `isStreaming`: 是否流式响应
- `startStream`: 开始流式响应
- `stopStream`: 停止流式响应

#### 全局管理器

##### `GlobalAIModelManager`

全局AI模型管理器，支持单例模式和发布-订阅机制。

**主要方法:**
- `getInstance(storage?)`: 获取单例实例
- `initialize()`: 初始化管理器
- `getCurrentModel()`: 获取当前模型
- `setCurrentModel(modelId)`: 设置当前模型
- `addConfig(config)`: 添加配置
- `updateConfig(id, updates)`: 更新配置
- `deleteConfig(id)`: 删除配置
- `subscribe(eventType, listener)`: 订阅事件
- `setErrorHandler(handler)`: 设置错误处理器

##### `AIEventManager`

AI事件管理器，管理对话和流式响应事件。

**主要方法:**
- `getInstance()`: 获取单例实例
- `startConversation()`: 开始新对话
- `stopConversation()`: 停止当前对话
- `clearConversation(id?)`: 清除对话
- `sendMessage(message)`: 发送消息
- `receiveMessage(message)`: 接收消息
- `startStream()`: 开始流式响应
- `stopStream()`: 停止流式响应
- `handleError(error, context?)`: 处理错误
- `subscribe(eventType, listener)`: 订阅事件

#### AI事件管理器 (AIEventManager)

##### `getAIEventManager()`

获取AI事件管理器单例实例。

**返回值:**
- `startConversation(id?)`: 开始新对话
- `stopConversation(reason?)`: 停止当前对话
- `clearConversation(id?)`: 清除对话
- `sendMessage(conversationId, message)`: 发送消息
- `receiveMessage(conversationId, message)`: 接收消息
- `startStream(conversationId)`: 开始流式响应
- `cancelStream()`: 取消流式响应
- `subscribe(eventType, listener)`: 订阅事件
- `getCurrentConversation()`: 获取当前对话
- `getAllConversations()`: 获取所有对话
- `getConversationStats()`: 获取对话统计

##### `useConversation()`

对话管理的简化Hook。

**返回值:**
- `currentConversation`: 当前对话状态
- `isActive`: 是否有活跃对话
- `isStreaming`: 是否正在流式响应
- `messageCount`: 消息数量
- `startConversation`: 开始对话
- `stopConversation`: 停止对话
- `clearConversation`: 清除对话

##### `useStreaming()`

流式响应管理的Hook。

**返回值:**
- `isStreaming`: 是否正在流式响应
- `startStream`: 开始流式响应
- `cancelStream`: 取消流式响应

#### SendOptions 接口

发送消息时的配置选项。

**属性:**
- `model?`: 模型名称
- `temperature?`: 温度参数 (0-2)
- `maxTokens?`: 最大token数量
- `topP?`: Top-p采样参数
- `frequencyPenalty?`: 频率惩罚 (-2.0 到 2.0)
- `presencePenalty?`: 存在惩罚 (-2.0 到 2.0)
- `jsonParams?`: 额外的JSON参数字符串
- `autoContinue?`: **自动继续功能** - 当AI响应因长度限制中断时，自动请求继续并合并响应
- `maxAutoContinue?`: **最大自动继续次数** - 防止无限循环，默认为3

**自动继续功能说明:**
- 当 `autoContinue: true` 时，系统会检测响应是否被中断
- 检测条件：`finishReason` 为 `"length"` 或内容看起来被截断
- 自动生成继续请求："请继续完成上述回答，从上次中断的地方继续。"
- 去重复合成：自动检测并去除重复的内容片段
- 返回的响应包含 `autoContinueState` 字段，显示自动继续的详细信息

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
| `formatLabel` | `(config: AIModelConfig) => string` | `undefined` | 自定义选项显示格式 |
| `manager` | `AIModelManager` | `undefined` | 管理器实例 |

#### GlobalAIModelManager 方法

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `subscribe(eventType, callback)` | `AIModelEventType, (event) => void` | `() => void` | 订阅事件 |
| `getCurrentModel()` | 无 | `AIModelConfig \| null` | 获取当前选中的模型 |
| `getCurrentModelId()` | 无 | `string \| null` | 获取当前选中的模型ID |
| `getConfigs()` | 无 | `AIModelConfig[]` | 获取所有配置 |
| `getConfigById(id)` | `string` | `AIModelConfig \| null` | 根据ID获取配置 |
| `setCurrentModel(modelId)` | `string \| null` | `Promise<void>` | 设置选中的模型 |
| `addConfig(config)` | `AIModelConfig` | `Promise<AIModelConfig>` | 添加配置 |
| `deleteConfig(id)` | `string` | `Promise<void>` | 删除配置 |
| `updateConfig(id, updates)` | `string, Partial<AIModelConfig>` | `Promise<AIModelConfig>` | 更新配置 |
| `initialize()` | 无 | `Promise<void>` | 初始化管理器 |
| `getStorageConfig()` | 无 | `StorageConfig` | 获取存储配置 |

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

### 自动继续功能最佳实践

#### 1. 智能使用自动继续

```tsx
// 根据内容类型智能启用自动继续
const sendMessageWithAutoContinue = async (message: string, sender: AIModelSender) => {
  // 检测是否需要长文本回答
  const needsLongResponse = message.includes('详细') || 
                           message.includes('长文') || 
                           message.includes('不少于') ||
                           message.length > 100;
  
  const options: SendOptions = {
    autoContinue: needsLongResponse,
    maxAutoContinue: needsLongResponse ? 3 : 1,
    maxTokens: needsLongResponse ? 800 : 2000,
    temperature: 0.7
  };
  
  return await sender.sendChatMessage([{ role: 'user', content: message }], options);
};
```

#### 2. 监控自动继续状态

```tsx
const handleAutoContinueResponse = (response: ChatResponse) => {
  if (response.autoContinueState) {
    const { currentAttempt, maxAttempts, isInterrupted } = response.autoContinueState;
    
    console.log(`自动继续状态: ${currentAttempt}/${maxAttempts} 尝试`);
    
    if (isInterrupted && currentAttempt >= maxAttempts) {
      console.warn('已达到最大自动继续次数，响应可能不完整');
    }
    
    // 在UI中显示自动继续进度
    showAutoContinueProgress(currentAttempt, maxAttempts);
  }
};
```

#### 3. 错误处理和重试机制

```tsx
const sendWithAutoContinueAndRetry = async (
  sender: AIModelSender, 
  messages: ChatMessage[], 
  maxRetries = 3
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await sender.sendChatMessage(messages, {
        autoContinue: true,
        maxAutoContinue: 3,
        maxTokens: 800
      });
      
      // 验证响应完整性
      if (response.autoContinueState?.isInterrupted) {
        throw new Error('响应被中断且无法自动继续');
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

#### 4. 流式响应的自动继续处理

```tsx
const handleStreamWithAutoContinue = async (sender: AIModelSender, messages: ChatMessage[]) => {
  let accumulatedContent = '';
  let autoContinueCount = 0;
  
  const response = await sender.sendChatMessageStream(messages, {
    autoContinue: true,
    maxAutoContinue: 3,
    maxTokens: 600
  }, (chunk) => {
    // 实时处理流式数据
    if (chunk.choices?.[0]?.delta?.content) {
      accumulatedContent += chunk.choices[0].delta.content;
      updateUI(accumulatedContent);
    }
  });
  
  // 处理自动继续状态
  if (response.autoContinueState) {
    autoContinueCount = response.autoContinueState.currentAttempt;
    console.log(`流式响应自动继续了 ${autoContinueCount} 次`);
  }
  
  return {
    content: response.choices[0].delta.content,
    autoContinueCount,
    isComplete: !response.autoContinueState?.isInterrupted
  };
};
```

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

#### AI模型选择器注意事项

1. **选中状态持久化**: 选中状态会自动保存到 localStorage，key 为 `{localStorageKey}-selected`
2. **管理器实例**: 管理器实例是单例的，多个组件可以共享同一个实例
3. **内存泄漏**: 记得在组件卸载时取消订阅回调，避免内存泄漏
4. **初始化**: 使用前需要调用 `initialize()` 方法
5. **命名规范**: 使用小写字母开头的命名，避免与React组件冲突
6. **存储方式**: 支持localStorage、API、自定义存储方式
7. **事件驱动**: 基于事件回调的设计，支持多个组件共享同一个管理器实例

#### 自动继续功能注意事项

1. **Token消耗**: 自动继续功能会增加API调用次数，请注意token消耗和费用
2. **最大次数限制**: 设置合理的 `maxAutoContinue` 值，避免无限循环和过度消耗
3. **响应时间**: 自动继续会增加响应时间，建议在UI中显示进度指示
4. **内容质量**: 虽然支持去重复，但多次继续可能影响内容的连贯性
5. **错误处理**: 建议监控 `autoContinueState.isInterrupted` 状态，处理无法继续的情况
6. **适用场景**: 主要适用于需要长文本回答的场景，短问题建议禁用自动继续
7. **流式响应**: 流式响应的自动继续会中断实时性，权衡用户体验和内容完整性

## 🚀 演示应用

项目包含完整的演示应用，展示组件的各种功能和用法。

### 运行演示

```bash
# AI模型选择器演示
cd examples/AIModelSelector && npm install && npm run dev

# 统一AI聊天收发器演示
cd examples/UnifiedAIChatTransceiver && npm install && npm run dev

# 未构建统一AI聊天收发器演示（包含代码块换行功能）
cd examples/UnbuildUnifiedAIChatTransceiver && npm install && npm run dev

# 未构建选择器演示
cd examples/UnbuildSelector && npm install && npm run dev
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
- 🔄 **自动继续功能演示** - 完整展示自动继续功能的使用和效果
- 🧪 **自动继续测试** - 提供测试组件验证自动继续功能
- 📊 **状态监控** - 实时显示自动继续状态和进度
- 📝 **代码块换行演示** - 展示代码块自动换行和宽度控制功能

## 🛠️ 开发

### 项目结构

```
packages/
├── ai_model_application_suite/     # 主要包
│   ├── src/
│   │   ├── components/       # React组件
│   │   ├── types/           # TypeScript类型定义
│   │   ├── utils/           # 工具函数
│   │   │   ├── AutoContinueManager.ts  # 自动继续管理器
│   │   │   ├── GlobalAIModelManager.ts # 全局AI模型管理器
│   │   │   ├── AIEventManager.ts       # AI事件管理器
│   │   │   └── storage.ts              # 存储管理
│   │   ├── providers/       # AI服务商实现
│   │   ├── hooks/           # React Hooks
│   │   ├── examples/        # 示例组件
│   │   │   ├── AutoContinueExample.tsx # 自动继续使用示例
│   │   │   └── AutoContinueTest.tsx    # 自动继续测试组件
│   │   └── styles/          # 样式文件
examples/
├── AIModelSelector/     # AI模型选择器演示
├── UnifiedAIChatTransceiver/  # 统一AI聊天收发器演示
├── UnbuildUnifiedAIChatTransceiver/  # 未构建统一AI聊天收发器演示
│   ├── components/
│   │   ├── css/
│   │   │   └── custom-code-block.css  # 代码块换行样式
│   │   └── MarkdownRenderer.tsx       # Markdown渲染器
│   └── markdown-theme-samantha.css    # Markdown主题样式
└── UnbuildSelector/     # 未构建选择器演示
```

### 本地开发

```bash
# 克隆项目
git clone <repository-url>
cd packages/ai_model_application_suite

# 安装依赖
yarn install

# 启动开发服务器
yarn dev

# 构建库文件
yarn build:lib

# 构建演示应用
yarn build
```

## 🛠️ 构建命令说明

### 构建命令对比

| 命令 | 功能描述 | 输出文件 | 适用场景 |
|------|----------|----------|----------|
| `build` | **完整构建**：清理 + Vite构建 + TypeScript声明文件生成 | JS文件 + CSS文件 + **声明文件(.d.ts)** | 生产发布、CI/CD |
| `build:lib` | **快速构建**：仅运行Vite构建 | JS文件 + CSS文件 | 开发调试、快速测试 |

### 使用场景建议

| 场景 | 推荐命令 | 原因说明 |
|------|----------|----------|
| **开发调试** | `npm run build:lib` | 构建速度快，适合频繁调试 |
| **本地测试** | `npm run build:lib` | 快速验证功能，无需类型声明 |
| **发布前测试** | `npm run build` | 完整构建，确保所有文件正确生成 |
| **发布到npm** | `npm run build` | 用户需要TypeScript声明文件 |
| **CI/CD流水线** | `npm run build` | 确保构建完整性和类型安全 |

### 构建流程

```bash
# 开发阶段 - 快速构建
npm run build:lib

# 发布阶段 - 完整构建
npm run build
```

**注意**：发布到npm前请务必使用 `npm run build` 确保生成完整的类型声明文件。

### 添加新的AI提供商

1. 在`packages/ai_model_application_suite/src/types/index.ts`中添加新的提供商枚举值
2. 在`packages/ai_model_application_suite/src/utils/providers.ts`中添加提供商元数据配置
3. 在`packages/ai_model_application_suite/src/providers/`中添加新的服务商实现
4. 更新文档和类型定义

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📝 更新日志

### v0.0.4 (最新)
- 🆕 **新增代码块换行支持** - 修复AI输出代码块宽度失控问题，支持行内换行展示
  - 新增 `custom-code-block.css` 样式文件，专门处理代码块换行
  - 优化 `SyntaxHighlighter` 配置，添加 `whiteSpace: 'pre-wrap'` 和 `wordBreak: 'break-word'`
  - 更新 `markdown-theme-samantha.css` 样式，支持代码块自动换行
  - 改进代码块Header样式，使用更现代的配色方案
- 🆕 **新增全局AI模型管理器** - 支持单例模式和发布-订阅机制，提供 `GlobalAIModelManager` 和 `getGlobalAIModelManager()`
- 🆕 **新增React Hook封装** - 简化组件使用，提供 `useAIModel`、`useCurrentAIModel`、`useAIEvents`、`useConversation`、`useStreaming` 等
- 🆕 **新增AI事件管理器** - 支持停止对话、新建会话等事件，提供 `AIEventManager` 和 `getAIEventManager()`
- 🆕 **新增统一错误处理** - 全局错误捕获和处理机制，支持自定义错误处理器
- 🆕 **新增流式响应管理** - 支持开始/取消流式响应，提供 `cancelStream()` 方法（`stopStream()` 已弃用）
- 🆕 **新增聊天功能示例** - 完整的聊天应用示例，支持取消功能
- 🆕 **新增自动继续功能** - 当AI响应因长度限制中断时，自动请求继续并合并响应，支持去重复合成
  - 智能中断检测：自动识别因token限制导致的响应中断
  - 自动继续请求：智能生成继续请求，确保内容完整性
  - 去重复合成：自动检测并合并重复内容片段
  - 状态跟踪：提供详细的自动继续状态信息
  - 支持普通消息和流式消息的自动继续
- 🆕 **新增AutoContinueManager** - 专门管理自动继续逻辑的工具类，支持智能中断检测和内容合并
  - 单例模式设计，确保状态一致性
  - 多种中断检测策略，提高准确性
  - 智能去重复算法，基于重叠检测的内容合并
  - 完整的错误处理和状态管理
- 🔧 **改进API设计** - 更简洁的API，更好的类型安全，统一的存储配置管理
- 🔧 **改进单例模式** - 支持动态存储配置，确保多组件间状态同步
- 🔧 **改进事件系统** - 完善的事件监听和取消机制
- 🔧 **改进长文本处理** - 通过自动继续功能，显著提升长文本响应的完整性
- 🔧 **改进代码块渲染** - 优化代码块样式和交互体验，解决宽度失控问题

### v0.0.3
- 🆕 **新增全局AI模型管理器** - 支持单例模式和发布-订阅机制，提供 `GlobalAIModelManager` 和 `getGlobalAIModelManager()`
- 🆕 **新增React Hook封装** - 简化组件使用，提供 `useAIModel`、`useCurrentAIModel`、`useAIEvents`、`useConversation`、`useStreaming` 等
- 🆕 **新增AI事件管理器** - 支持停止对话、新建会话等事件，提供 `AIEventManager` 和 `getAIEventManager()`
- 🆕 **新增统一错误处理** - 全局错误捕获和处理机制，支持自定义错误处理器
- 🆕 **新增流式响应管理** - 支持开始/取消流式响应，提供 `cancelStream()` 方法（`stopStream()` 已弃用）
- 🆕 **新增聊天功能示例** - 完整的聊天应用示例，支持取消功能
- 🆕 **新增自动继续功能** - 当AI响应因长度限制中断时，自动请求继续并合并响应，支持去重复合成
- 🆕 **新增AutoContinueManager** - 专门管理自动继续逻辑的工具类，支持智能中断检测和内容合并
- 🔧 **改进API设计** - 更简洁的API，更好的类型安全，统一的存储配置管理
- 🔧 **改进单例模式** - 支持动态存储配置，确保多组件间状态同步
- 🔧 **改进事件系统** - 完善的事件监听和取消机制
- 🔧 **改进长文本处理** - 通过自动继续功能，显著提升长文本响应的完整性

### v0.0.2
- 初始版本发布
- 支持主流AI提供商
- 提供localStorage和API存储方式
- 响应式设计和自定义主题支持
- AI模型选择器状态持久化
- AI消息适配器统一接口
- 流式响应支持

## todo

- 思维链
