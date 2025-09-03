// AI 提供商枚举
export enum AIProvider {
  OPENAI = 'openai',
  VOLCENGINE = 'volcengine'
}

// AI 模型配置接口
export interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  config: {
    apiKey: string;
    baseURL?: string;
    model?: string;
    jsonParams?: string;
  };
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

// AI 模型发送器接口
export interface AIModelSender {
  sendChatMessage(messages: ChatMessage[], options?: SendOptions): Promise<ChatResponse>;
  sendChatMessageStream(messages: ChatMessage[], options?: SendOptions): Promise<any>;
  sendCompletion(prompt: string, options?: SendOptions): Promise<CompletionResponse>;
  sendCompletionStream(prompt: string, options?: SendOptions): Promise<CompletionStreamResponse>;
}

// AI 模型发送器工厂接口
export interface AIModelSenderFactory {
  createSender(config: AIModelConfig): AIModelSender;
  supportsProvider(provider: AIProvider): boolean;
}

// 聊天消息接口
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 发送选项接口
export interface SendOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  jsonParams?: string;
}

// 聊天响应接口
export interface ChatResponse {
  id: string;
  model: string;
  choices: [{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finishReason: string;
  }];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  created: number;
}

// 聊天流响应接口
export interface ChatStreamResponse {
  id: string;
  model: string;
  choices: [{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
    };
    finishReason?: string;
  }];
  created: number;
}

// 完成响应接口
export interface CompletionResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// 完成流响应接口
export interface CompletionStreamResponse {
  text: string;
  done: boolean;
}
