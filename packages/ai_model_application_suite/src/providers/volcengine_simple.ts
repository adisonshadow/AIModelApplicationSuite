import OpenAI from 'openai';
import { AIModelConfig, AIModelSender, ChatMessage, SendOptions, ChatResponse, ChatStreamResponse, CompletionResponse, CompletionStreamResponse } from '../types';

export class VolcengineAISender implements AIModelSender {
  private client: OpenAI;
  private config: AIModelConfig;

  constructor(config: AIModelConfig) {
    this.config = config;
    
    // 创建 OpenAI 客户端，配置为使用火山引擎
    this.client = new OpenAI({
      apiKey: config.config?.apiKey || '',
      baseURL: config.config?.baseURL || 'https://ark.cn-beijing.volces.com/api/v3',
      dangerouslyAllowBrowser: true
    });
  }

  async sendChatMessage(messages: ChatMessage[], options?: SendOptions): Promise<ChatResponse> {
    try {
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
    // 简单逻辑：只有启用了自动继续才处理
    const autoContinueEnabled = options?.autoContinue === true;
    const maxAutoContinue = options?.maxAutoContinue || 3;
    
    let accumulatedContent = '';
    let currentMessages = [...messages];
    let attemptCount = 0;
    let responseId = '';
    let model = options?.model || this.config.config?.model || 'deepseek-v3-1-250821';
    let created = Math.floor(Date.now() / 1000);

    try {
      while (true) {
        attemptCount++;
        console.log(`🔄 开始第 ${attemptCount} 次请求`);
        
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
          model: model,
          messages: currentMessages.map(msg => ({
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

        // 处理流式响应
        let currentSegmentContent = '';
        let finishReason = 'stop';

        for await (const chunk of response as any) {
          if (chunk.id) responseId = chunk.id;
          
          if (chunk.choices && chunk.choices.length > 0) {
            chunk.choices.forEach((choice: any) => {
              if (choice.delta && choice.delta.content) {
                currentSegmentContent += choice.delta.content;
                accumulatedContent += choice.delta.content;
                
                // 实时调用 onUpdate 回调，传递累积内容
                if (onUpdate) {
                  onUpdate({
                    id: responseId,
                    model: model,
                    choices: [{
                      index: 0,
                      delta: {
                        role: 'assistant',
                        content: accumulatedContent // 传递累积内容
                      },
                      finishReason: choice.finish_reason
                    }],
                    created: created
                  });
                }
              }
              if (choice.finish_reason) {
                finishReason = choice.finish_reason;
              }
            });
          }
        }

        console.log(`🏁 第 ${attemptCount} 次请求完成，原因: ${finishReason}`);
        console.log(`📝 当前段内容长度: ${currentSegmentContent.length}`);
        console.log(`📝 累积内容长度: ${accumulatedContent.length}`);

        // 检查是否需要继续
        if (finishReason === 'stop') {
          console.log('✅ 响应完成，停止');
          break;
        }

        if (finishReason === 'length' && autoContinueEnabled && attemptCount < maxAutoContinue) {
          console.log(`🔄 检测到长度限制，准备继续 (${attemptCount}/${maxAutoContinue})`);
          
          // 生成继续消息
          const continueMessage: ChatMessage = {
            role: 'user',
            content: `刚才结束在 "${accumulatedContent.slice(-50)}"，请在此段文字之后继续。`
          };
          
          currentMessages = [...currentMessages, continueMessage];
          console.log('📤 发送继续请求:', continueMessage.content);
        } else {
          console.log('❌ 无法继续:', { finishReason, autoContinueEnabled, attemptCount, maxAutoContinue });
          break;
        }
      }

      return {
        id: responseId,
        model: model,
        choices: [{
          index: 0,
          delta: {
            role: 'assistant',
            content: accumulatedContent
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
        prompt: prompt,
        temperature: options?.temperature || extraParams.temperature || 0.7,
        max_tokens: options?.maxTokens || extraParams.max_tokens || 1000,
        top_p: options?.topP || extraParams.top_p || 1,
        frequency_penalty: options?.frequencyPenalty || extraParams.frequency_penalty || 0,
        presence_penalty: options?.presencePenalty || extraParams.presence_penalty || 0,
        ...extraParams
      });

      const choice = response.choices[0];
      if (!choice || !choice.text) {
        throw new Error('AI 响应格式错误');
      }

      return {
        text: choice.text,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        }
      };

    } catch (error) {
      console.error('发送完成请求失败:', error);
      throw error;
    }
  }

  async sendCompletionStream(prompt: string, options?: SendOptions): Promise<CompletionStreamResponse> {
    try {
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
        prompt: prompt,
        temperature: options?.temperature || extraParams.temperature || 0.7,
        max_tokens: options?.maxTokens || extraParams.max_tokens || 1000,
        top_p: options?.topP || extraParams.top_p || 1,
        frequency_penalty: options?.frequencyPenalty || extraParams.frequency_penalty || 0,
        presence_penalty: options?.presencePenalty || extraParams.presence_penalty || 0,
        stream: true,
        ...extraParams
      });

      return response as any;

    } catch (error) {
      console.error('发送流式完成请求失败:', error);
      throw error;
    }
  }
}
