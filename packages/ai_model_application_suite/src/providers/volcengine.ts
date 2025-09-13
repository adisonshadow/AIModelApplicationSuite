import OpenAI from 'openai';
import { AIModelConfig, AIProvider, AIModelSender, ChatMessage, SendOptions, ChatResponse, ChatStreamResponse, CompletionResponse, CompletionStreamResponse } from '../types';

export class VolcengineAISender implements AIModelSender {
  private client: OpenAI;
  private config: AIModelConfig;

  constructor(config: AIModelConfig) {
    this.config = config;
    
    // 支持 OpenAI 和 Volcengine
    if (config.provider === AIProvider.VOLCENGINE || config.provider === AIProvider.OPENAI) {
      this.client = new OpenAI({
        apiKey: config.config?.apiKey || '',
        baseURL: config.config?.baseURL || 'https://ark.cn-beijing.volces.com/api/v3',
        dangerouslyAllowBrowser: true, // 允许在浏览器中使用
      });
    } else {
      throw new Error(`不支持的 AI 提供商: ${config.provider}`);
    }
  }

  async sendChatMessage(messages: ChatMessage[], options?: SendOptions): Promise<ChatResponse> {
    try {
      // 解析额外的 JSON 参数
      let extraParams: any = {};
      if (this.config.config?.jsonParams) {
        try {
          extraParams = JSON.parse(this.config.config.jsonParams);
        } catch (error) {
          console.warn('解析额外 JSON 参数失败:', error);
        }
      }

      const response = await this.client.chat.completions.create({
        model: options?.model || this.config.config?.model || 'deepseek-v3-1-250821',
        messages: messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })),
        temperature: options?.temperature || extraParams.temperature || 0.7,
        max_tokens: options?.maxTokens || extraParams.max_tokens || 1000,
        top_p: options?.topP || extraParams.top_p || 1,
        frequency_penalty: options?.frequencyPenalty || extraParams.frequency_penalty || 0,
        presence_penalty: options?.presencePenalty || extraParams.presence_penalty || 0,
        ...extraParams
      });

      const choice = response.choices[0];
      if (!choice || !choice.message) {
        throw new Error('AI 响应格式错误');
      }

      return {
        id: response.id,
        model: response.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: choice.message.content || ''
          },
          finishReason: choice.finish_reason || 'stop'
        }],
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        },
        created: response.created
      };
    } catch (error) {
      console.error('发送聊天消息失败:', error);
      throw error;
    }
  }

  async sendChatMessageStream(messages: ChatMessage[], options?: SendOptions, onUpdate?: (chunk: any) => void): Promise<ChatStreamResponse> {
    try {
      // 解析额外的 JSON 参数
      let extraParams: any = {};
      if (this.config.config?.jsonParams) {
        try {
          extraParams = JSON.parse(this.config.config.jsonParams);
        } catch (error) {
          console.warn('解析额外 JSON 参数失败:', error);
        }
      }

      const response = await this.client.chat.completions.create({
        model: options?.model || this.config.config?.model || 'deepseek-v3-1-250821',
        messages: messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })),
        temperature: options?.temperature || extraParams.temperature || 0.7,
        max_tokens: options?.maxTokens || extraParams.max_tokens || 1000,
        top_p: options?.topP || extraParams.top_p || 1,
        frequency_penalty: options?.frequencyPenalty || extraParams.frequency_penalty || 0,
        presence_penalty: options?.presencePenalty || extraParams.presence_penalty || 0,
        stream: true,
        ...extraParams
      });

      // 处理流式响应 - 实时处理每个 chunk
      let fullContent = '';
      let responseId = '';
      let model = response.model;
      let created = Math.floor(Date.now() / 1000);

      for await (const chunk of response as any) {
        console.log('🔄 收到原始流式数据块:', chunk);
        
        // 实时调用 onUpdate 回调
        if (onUpdate) {
          onUpdate(chunk);
        }
        
        if (chunk.id) responseId = chunk.id;
        
        if (chunk.choices && chunk.choices.length > 0) {
          chunk.choices.forEach((choice: any) => {
            if (choice.delta && choice.delta.content) {
              fullContent += choice.delta.content;
              console.log('📝 累积内容:', fullContent);
            }
            if (choice.finish_reason) {
              console.log('🏁 流式完成，原因:', choice.finish_reason);
            }
          });
        }
      }

      // 返回完整的响应
      return {
        id: responseId,
        model: model,
        choices: [{
          index: 0,
          delta: {
            role: 'assistant',
            content: fullContent
          },
          finishReason: 'stop'
        }],
        created: created
      };
    } catch (error) {
      console.error('发送流式聊天消息失败:', error);
      throw error;
    }
  }

  async sendCompletion(prompt: string, options?: SendOptions): Promise<CompletionResponse> {
    try {
      // 解析额外的 JSON 参数
      let extraParams: any = {};
      if (this.config.config?.jsonParams) {
        try {
          extraParams = JSON.parse(this.config.config.jsonParams);
        } catch (error) {
          console.warn('解析额外 JSON 参数失败:', error);
        }
      }

      const response = await this.client.completions.create({
        model: options?.model || this.config.config?.model || 'deepseek-v3-1-250821',
        prompt,
        temperature: options?.temperature || extraParams.temperature || 0.7,
        max_tokens: options?.maxTokens || extraParams.max_tokens || 1000,
        top_p: options?.topP || extraParams.top_p || 1,
        frequency_penalty: options?.frequencyPenalty || extraParams.frequency_penalty || 0,
        presence_penalty: options?.presencePenalty || extraParams.presence_penalty || 0,
        ...extraParams
      });

      const choice = response.choices[0];
      if (!choice) {
        throw new Error('AI 响应格式错误');
      }

      return {
        text: choice.text || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      console.error('发送补全请求失败:', error);
      throw error;
    }
  }

  async sendCompletionStream(prompt: string, options?: SendOptions): Promise<CompletionStreamResponse> {
    try {
      // 解析额外的 JSON 参数
      let extraParams: any = {};
      if (this.config.config?.jsonParams) {
        try {
          extraParams = JSON.parse(this.config.config.jsonParams);
        } catch (error) {
          console.warn('解析额外 JSON 参数失败:', error);
        }
      }

      const response = await this.client.completions.create({
        model: options?.model || this.config.config?.model || 'deepseek-v3-1-250821',
        prompt,
        temperature: options?.temperature || extraParams.temperature || 0.7,
        max_tokens: options?.maxTokens || extraParams.max_tokens || 1000,
        top_p: options?.topP || extraParams.top_p || 1,
        frequency_penalty: options?.frequencyPenalty || extraParams.frequency_penalty || 0,
        presence_penalty: options?.presencePenalty || extraParams.presence_penalty || 0,
        stream: true,
        ...extraParams
      });

      let text = '';
      for await (const chunk of response as any) {
        if (chunk.choices && chunk.choices.length > 0) {
          chunk.choices.forEach((choice: any) => {
            if (choice.text) {
              text += choice.text;
            }
          });
        }
      }

      return {
        text,
        done: true
      };
    } catch (error) {
      console.error('发送流式补全请求失败:', error);
      throw error;
    }
  }
}
