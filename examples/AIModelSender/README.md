# AI消息适配器 (AI Message Adapter)

AI消息适配器是一个统一的接口层，允许开发人员使用统一的API与不同的AI服务商进行消息交互，无需关心底层服务商的差异。

## 特性

- 🔄 **统一接口**: 使用相同的API与不同AI服务商交互
- 🚀 **简单易用**: 简洁的API设计，快速上手
- 🔌 **可扩展**: 支持添加新的AI服务商
- 💬 **消息流**: 支持流式响应和普通响应
- 🛡️ **类型安全**: 完整的TypeScript类型支持

## 快速开始

### 安装

```bash
npm install @your-org/ai-model-sender
```

### 基本使用

```typescript
import { createAIModelSender } from '@your-org/ai-model-sender';

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

## 详细使用指南

### 1. 创建发送器

```typescript
import { createAIModelSender } from '@your-org/ai-model-sender';

// 方式1: 使用配置对象
const sender = createAIModelSender({
  provider: 'volcengine',
  config: {
    apiKey: 'your-api-key',
    region: 'cn-beijing',
    model: 'deepseek-v3.1'
  }
});

// 方式2: 使用工厂函数
const sender = createAIModelSender({
  provider: 'openai',
  config: {
    apiKey: 'your-openai-key',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4'
  }
});
```

### 2. 发送消息

#### 普通消息

```typescript
// 单轮对话
const response = await sender.sendMessage({
  messages: [
    { role: 'user', content: '请解释什么是人工智能' }
  ]
});

console.log('AI回复:', response.content);
```

#### 多轮对话

```typescript
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

#### 流式响应

```typescript
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

### 3. 高级功能

#### 自定义参数

```typescript
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

```typescript
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

## 支持的服务商

### Volcengine (火山引擎)

```typescript
const sender = createAIModelSender({
  provider: 'volcengine',
  config: {
    apiKey: 'your-volcengine-key',
    region: 'cn-beijing', // 可选
    model: 'deepseek-v3.1' // 可选，默认模型
  }
});
```

### OpenAI

```typescript
const sender = createAIModelSender({
  provider: 'openai',
  config: {
    apiKey: 'your-openai-key',
    baseURL: 'https://api.openai.com/v1', // 可选
    model: 'gpt-4' // 可选，默认模型
  }
});
```

### 自定义服务商

```typescript
// 实现自定义服务商
class CustomProvider implements AIProvider {
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    // 实现发送逻辑
    return {
      content: '自定义回复',
      usage: { promptTokens: 10, completionTokens: 5 }
    };
  }

  async sendMessageStream(request: SendMessageRequest): Promise<AsyncIterable<ChatStreamResponse>> {
    // 实现流式发送逻辑
    return this.createStream(request);
  }
}

// 注册自定义服务商
registerProvider('custom', CustomProvider);

// 使用自定义服务商
const sender = createAIModelSender({
  provider: 'custom',
  config: {
    // 自定义配置
  }
});
```

## API 参考

### 核心接口

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
```

## 最佳实践

### 1. 错误处理

```typescript
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

### 2. 消息管理

```typescript
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

### 3. 流式处理

```typescript
const handleStream = async (stream: AsyncIterable<ChatStreamResponse>) => {
  let fullContent = '';
  
  for await (const chunk of stream) {
    switch (chunk.type) {
      case 'content':
        fullContent += chunk.content;
        process.stdout.write(chunk.content);
        break;
      case 'done':
        console.log('\n完成');
        break;
      case 'error':
        console.error('流式错误:', chunk.error);
        break;
    }
  }
  
  return fullContent;
};
```

## 示例项目

查看 `examples/AIModelSender/App.tsx` 获取完整的示例代码，包括：

- 基本的消息发送
- 流式响应处理
- 错误处理
- UI界面演示

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 许可证

MIT License
