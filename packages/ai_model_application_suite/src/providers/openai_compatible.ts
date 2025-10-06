import OpenAI from 'openai';
import { AIModelConfig, AIModelSender, ChatMessage, SendOptions, ChatResponse, ChatStreamResponse } from '../types';

/**
 * OpenAI 兼容的 AI 模型发送器基类
 * 支持所有使用 OpenAI API 格式的提供商（OpenAI、Volcengine、Doubao 等）
 */
export class OpenAICompatibleSender implements AIModelSender {
  protected client: OpenAI;
  protected config: AIModelConfig;

  constructor(config: AIModelConfig) {
    this.config = config;
    
    this.client = new OpenAI({
      apiKey: config.config?.apiKey || '',
      baseURL: config.config?.baseURL || 'https://api.openai.com/v1',
      dangerouslyAllowBrowser: true,
    });
  }

  // 解析额外参数
  private parseExtraParams(): any {
    if (!this.config.config?.jsonParams) return {};
    
    try {
      return JSON.parse(this.config.config.jsonParams);
    } catch (error) {
      console.error('解析 jsonParams 失败:', error);
      return {};
    }
  }

  // 生成会话 ID
  private generateSessionId(options?: SendOptions): string {
    if (options?.metadata?.session_id) {
      return options.metadata.session_id;
    }
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  async sendChatMessage(messages: ChatMessage[], options?: SendOptions): Promise<ChatResponse> {
    const model = options?.model || this.config.config?.model || 'gpt-3.5-turbo';
    const extraParams = this.parseExtraParams();

    try {
      const response = await this.client.chat.completions.create({
        model: model,
        messages: messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })),
        temperature: options?.temperature || extraParams.temperature || 0.7,
        max_tokens: options?.maxTokens || extraParams.max_tokens || 1000,
        top_p: options?.topP || extraParams.top_p || 1,
        frequency_penalty: options?.frequencyPenalty || extraParams.frequency_penalty || 0,
        presence_penalty: options?.presencePenalty || extraParams.presence_penalty || 0,
        stream: false,
        ...((options as any)?.functions && { functions: (options as any).functions }),
        ...((options as any)?.function_call && { function_call: (options as any).function_call }),
        ...extraParams
      });

      return {
        id: response.id,
        model: response.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: response.choices[0]?.message?.content || ''
          },
          finishReason: response.choices[0]?.finish_reason || 'stop'
        }],
        usage: {
          promptTokens: (response as any).usage?.prompt_tokens || 0,
          completionTokens: (response as any).usage?.completion_tokens || 0,
          totalTokens: (response as any).usage?.total_tokens || 0
        },
        created: response.created
      };
    } catch (error) {
      console.error('发送聊天消息失败:', error);
      throw error;
    }
  }

  async sendChatMessageStream(
    messages: ChatMessage[], 
    options?: SendOptions, 
    onUpdate?: (chunk: any) => void,
    onFinish?: (result: { finishReason: string; fullContent: string }) => void
  ): Promise<ChatStreamResponse> {
    const model = options?.model || this.config.config?.model || 'gpt-3.5-turbo';
    const extraParams = this.parseExtraParams();
    const responseId = this.generateSessionId(options);
    let accumulatedContent = '';
    const created = Math.floor(Date.now() / 1000);

    try {
      const response = await this.client.chat.completions.create({
        model: model,
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
        metadata: {
          session_id: responseId
        },
        ...((options as any)?.functions && { functions: (options as any).functions }),
        ...((options as any)?.function_call && { function_call: (options as any).function_call }),
        ...extraParams
      });

      let finishReason = 'stop';

      let accumulatedReasoningContent = '';
      
      for await (const chunk of response as any) {
        if (chunk.choices && chunk.choices.length > 0) {
          const choice = chunk.choices[0];
          
          if (choice.delta) {
            // 处理内容
            if (choice.delta.content) {
              accumulatedContent += choice.delta.content;
            }
            
            // 处理思考内容
            if (choice.delta.reasoning_content) {
              accumulatedReasoningContent += choice.delta.reasoning_content;
            }
            
            // 实时调用 onUpdate 回调 - 传递增量内容
            if (onUpdate) {
              onUpdate({
                id: chunk.id || responseId,
                model: model,
                choices: [{
                  index: 0,
                  delta: {
                    role: 'assistant',
                    content: choice.delta.content || '',
                    reasoning_content: choice.delta.reasoning_content || ''
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
        }
      }

      // 调用 onFinish 回调
      if (onFinish) {
        onFinish({
          finishReason: finishReason,
          fullContent: accumulatedContent
        });
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
          finishReason: finishReason
        }],
        created: created
      };
    } catch (error) {
      console.error('发送流式聊天消息失败:', error);
      throw error;
    }
  }

  async sendCompletion(_prompt: string, _options?: SendOptions): Promise<any> {
    throw new Error('OpenAI Chat API does not support completion mode. Please use sendChatMessage instead.');
  }

  async sendCompletionStream(
    _prompt: string,
    _options?: SendOptions,
    _onUpdate?: (chunk: any) => void
  ): Promise<any> {
    throw new Error('OpenAI Chat API does not support completion mode. Please use sendChatMessageStream instead.');
  }
}
