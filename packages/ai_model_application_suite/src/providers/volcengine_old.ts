import OpenAI from 'openai';
import { AIModelConfig, AIProvider, AIModelSender, ChatMessage, SendOptions, ChatResponse, ChatStreamResponse, CompletionResponse, CompletionStreamResponse } from '../types';
import { AutoContinueManager } from '../utils/AutoContinueManager';

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
    const autoContinueManager = AutoContinueManager.getInstance();
    const autoContinueState = autoContinueManager.initializeAutoContinue(options);
    
    let accumulatedContent = '';
    let currentMessages = [...messages];
    let finalResponse: any = null;

    try {
      // 执行自动继续循环
      while (autoContinueManager.canContinue()) {
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
          messages: currentMessages.map(msg => ({
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

        const responseContent = choice.message.content || '';
        
        // 合并内容
        accumulatedContent = autoContinueManager.mergeResponseContent(responseContent);
        
        // 保存最终响应
        finalResponse = {
          id: response.id,
          model: response.model,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: accumulatedContent
            },
            finishReason: choice.finish_reason || 'stop'
          }],
          usage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0
          },
          created: response.created,
          autoContinueState: autoContinueState
        };

        // 检查是否需要继续
        if (!autoContinueManager.isResponseInterrupted(response)) {
          console.log('✅ 响应完成，无需继续');
          break;
        }

        // 如果可以继续，生成继续消息
        if (autoContinueManager.canContinue()) {
          autoContinueManager.incrementAttempt();
          currentMessages = autoContinueManager.generateContinueMessage(messages, accumulatedContent);
          console.log('🔄 准备继续请求，尝试次数:', autoContinueManager.getCurrentState()?.currentAttempt);
        }
      }

      // 完成自动继续
      const finalContent = autoContinueManager.completeAutoContinue();
      
      if (finalResponse) {
        finalResponse.choices[0].message.content = finalContent;
      }

      return finalResponse || {
        id: 'error',
        model: this.config.config?.model || 'unknown',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: accumulatedContent || '响应失败'
          },
          finishReason: 'error'
        }],
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        },
        created: Math.floor(Date.now() / 1000)
      };

    } catch (error) {
      console.error('发送聊天消息失败:', error);
      autoContinueManager.reset();
      throw error;
    }
  }

  async sendChatMessageStream(messages: ChatMessage[], options?: SendOptions, onUpdate?: (chunk: any) => void): Promise<ChatStreamResponse> {
    const autoContinueManager = AutoContinueManager.getInstance();
    const autoContinueState = autoContinueManager.initializeAutoContinue(options);
    
    let accumulatedContent = '';
    let currentMessages = [...messages];
    let attemptCount = 0;
    let finalResponse: any = null;

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
          model: options?.model || this.config.config?.model || 'deepseek-v3-1-250821',
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

        // 处理流式响应 - 实时处理每个 chunk
        let fullContent = '';
        let responseId = '';
        let model = response.model;
        let created = Math.floor(Date.now() / 1000);
        let finishReason = 'stop';

        for await (const chunk of response as any) {
          console.log('🔄 收到原始流式数据块:', chunk);
          
          if (chunk.id) responseId = chunk.id;
          
          if (chunk.choices && chunk.choices.length > 0) {
            chunk.choices.forEach((choice: any) => {
              if (choice.delta && choice.delta.content) {
                fullContent += choice.delta.content;
                console.log('📝 累积内容:', fullContent);
                
                // 实时调用 onUpdate 回调，传递累积内容
                if (onUpdate) {
                  const accumulatedChunk = {
                    id: responseId,
                    model: model,
                    choices: [{
                      index: 0,
                      delta: {
                        role: 'assistant',
                        content: fullContent // 传递累积内容，不是增量内容
                      },
                      finishReason: choice.finish_reason
                    }],
                    created: created,
                    autoContinueState: autoContinueState
                  };
                  onUpdate(accumulatedChunk);
                }
              }
              if (choice.finish_reason) {
                finishReason = choice.finish_reason;
                console.log('🏁 流式完成，原因:', choice.finish_reason);
              }
            });
          }
        }

        // 合并内容
        accumulatedContent = autoContinueManager.mergeResponseContent(fullContent);
        
        // 保存最终响应（只在第一次或内容有变化时更新）
        if (!finalResponse) {
          finalResponse = {
            id: responseId,
            model: model,
            choices: [{
              index: 0,
              delta: {
                role: 'assistant',
                content: accumulatedContent
              },
              finishReason: finishReason
            }],
            created: created,
            autoContinueState: autoContinueState
          };
        } else {
          // 更新现有响应的内容
          finalResponse.choices[0].delta.content = accumulatedContent;
          finalResponse.autoContinueState = autoContinueState;
        }

        // 检查是否需要继续
        const mockResponse = {
          choices: [{ 
            finishReason: finishReason,
            message: { content: accumulatedContent }
          }]
        };
        
        if (!autoContinueManager.isResponseInterrupted(mockResponse)) {
          console.log('✅ 流式响应完成，无需继续');
          break;
        }

        // 如果可以继续，生成继续消息
        if (autoContinueManager.canContinue()) {
          autoContinueManager.incrementAttempt();
          currentMessages = autoContinueManager.generateContinueMessage(messages, accumulatedContent);
          console.log('🔄 准备继续流式请求，尝试次数:', autoContinueManager.getCurrentState()?.currentAttempt);
        }
      }

      // 完成自动继续
      const finalContent = autoContinueManager.completeAutoContinue();
      
      if (finalResponse) {
        finalResponse.choices[0].delta.content = finalContent;
      }

      return finalResponse || {
        id: 'stream-error-' + Date.now(),
        model: this.config.config?.model || 'unknown',
        choices: [{
          index: 0,
          delta: {
            role: 'assistant',
            content: accumulatedContent || '流式响应失败'
          },
          finishReason: 'error'
        }],
        created: Math.floor(Date.now() / 1000)
      };

    } catch (error) {
      console.error('发送流式聊天消息失败:', error);
      autoContinueManager.reset();
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
