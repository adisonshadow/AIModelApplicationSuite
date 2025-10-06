import { AIModelConfig, AIModelSender, ChatMessage, SendOptions, ChatResponse, ChatStreamResponse } from '../types';

// 动态导入 @google/genai，避免编译时错误
let GoogleGenerativeAI: any;
let isGoogleGenAIAvailable = false;

try {
  const genai = require('@google/genai');
  GoogleGenerativeAI = genai.GoogleGenerativeAI;
  isGoogleGenAIAvailable = true;
} catch (error) {
  // @google/genai 未安装
  isGoogleGenAIAvailable = false;
}

/**
 * Google Gemini AI 模型发送器
 * 支持 Google Gemini API
 * 
 * 使用前需要安装: npm install @google/genai
 */
export class GoogleGeminiSender implements AIModelSender {
  protected client: any;
  protected model: any;
  protected config: AIModelConfig;

  constructor(config: AIModelConfig) {
    this.config = config;
    
    // 检查 @google/genai 是否已安装
    if (!isGoogleGenAIAvailable || !GoogleGenerativeAI) {
      throw new Error(
        '使用 Google Gemini 需要安装 @google/genai 包。\n' +
        '请运行: npm install @google/genai 或 yarn add @google/genai\n' +
        '更多信息: https://www.npmjs.com/package/@google/genai'
      );
    }
    
    const apiKey = config.config?.apiKey || '';
    this.client = new GoogleGenerativeAI(apiKey);
    
    // 获取模型名称，默认使用 gemini-pro
    const modelName = config.config?.model || 'gemini-pro';
    this.model = this.client.getGenerativeModel({ model: modelName });
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

  // 转换消息格式：从通用格式转为 Gemini 格式
  private convertMessages(messages: ChatMessage[]): { history: any[], currentMessage: string } {
    const history: any[] = [];
    let currentMessage = '';
    let systemInstruction = '';

    // 处理系统消息
    const systemMessages = messages.filter(msg => msg.role === 'system');
    if (systemMessages.length > 0) {
      systemInstruction = systemMessages.map(msg => msg.content).join('\n\n');
    }

    // 处理用户和助手消息
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    
    for (let i = 0; i < conversationMessages.length; i++) {
      const msg = conversationMessages[i];
      
      if (i === conversationMessages.length - 1 && msg.role === 'user') {
        // 最后一条用户消息作为当前消息
        currentMessage = msg.content;
      } else {
        // 其他消息加入历史
        history.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }

    // 如果有系统指令，添加到第一条消息
    if (systemInstruction && history.length === 0 && currentMessage) {
      currentMessage = `${systemInstruction}\n\n${currentMessage}`;
    } else if (systemInstruction && history.length > 0) {
      // 将系统指令添加到历史的第一条消息
      history.unshift({
        role: 'user',
        parts: [{ text: systemInstruction }]
      });
      history.splice(1, 0, {
        role: 'model',
        parts: [{ text: '好的，我明白了。我会按照您的要求来回答问题。' }]
      });
    }

    return { history, currentMessage };
  }

  // 检查 Google Gemini 是否可用（静态方法）
  static isAvailable(): boolean {
    return isGoogleGenAIAvailable;
  }

  async sendChatMessage(messages: ChatMessage[], options?: SendOptions): Promise<ChatResponse> {
    const extraParams = this.parseExtraParams();
    const responseId = this.generateSessionId(options);

    try {
      const { history, currentMessage } = this.convertMessages(messages);

      // 创建聊天会话
      const chat: any = this.model.startChat({
        history,
        generationConfig: {
          temperature: options?.temperature ?? extraParams.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? extraParams.max_tokens ?? extraParams.maxOutputTokens ?? 2048,
          topP: options?.topP ?? extraParams.top_p ?? extraParams.topP ?? 0.9,
          topK: extraParams.top_k ?? extraParams.topK ?? 40,
          ...extraParams
        },
      });

      // 发送消息
      const result = await chat.sendMessage(currentMessage);
      const response = result.response;
      const text = response.text();

      const created = Math.floor(Date.now() / 1000);

      return {
        id: responseId,
        model: this.config.config?.model || 'gemini-pro',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: text
          },
          finishReason: this.mapFinishReason(response)
        }],
        usage: {
          promptTokens: this.estimateTokens(messages),
          completionTokens: this.estimateTokens([{ role: 'assistant', content: text }]),
          totalTokens: this.estimateTokens([...messages, { role: 'assistant', content: text }])
        },
        created
      };
    } catch (error) {
      console.error('Google Gemini 发送聊天消息失败:', error);
      throw error;
    }
  }

  async sendChatMessageStream(
    messages: ChatMessage[], 
    options?: SendOptions, 
    onUpdate?: (chunk: any) => void,
    onFinish?: (result: { finishReason: string; fullContent: string }) => void
  ): Promise<ChatStreamResponse> {
    const extraParams = this.parseExtraParams();
    const responseId = this.generateSessionId(options);
    let accumulatedContent = '';
    const created = Math.floor(Date.now() / 1000);

    try {
      const { history, currentMessage } = this.convertMessages(messages);

      // 创建聊天会话
      const chat: any = this.model.startChat({
        history,
        generationConfig: {
          temperature: options?.temperature ?? extraParams.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? extraParams.max_tokens ?? extraParams.maxOutputTokens ?? 2048,
          topP: options?.topP ?? extraParams.top_p ?? extraParams.topP ?? 0.9,
          topK: extraParams.top_k ?? extraParams.topK ?? 40,
          ...extraParams
        },
      });

      // 发送流式消息
      const result = await chat.sendMessageStream(currentMessage);
      
      let finishReason = 'stop';

      // 处理流式响应
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        
        if (chunkText) {
          accumulatedContent += chunkText;
          
          // 实时调用 onUpdate 回调
          if (onUpdate) {
            onUpdate({
              id: responseId,
              model: this.config.config?.model || 'gemini-pro',
              choices: [{
                index: 0,
                delta: {
                  role: 'assistant',
                  content: chunkText,
                  reasoning_content: '' // Gemini 目前不支持思考内容
                },
                finishReason: undefined
              }],
              created
            });
          }
        }
      }

      // 获取最终响应以确定完成原因
      const finalResponse = await result.response;
      finishReason = this.mapFinishReason(finalResponse);

      // 调用 onFinish 回调
      if (onFinish) {
        onFinish({
          finishReason,
          fullContent: accumulatedContent
        });
      }

      return {
        id: responseId,
        model: this.config.config?.model || 'gemini-pro',
        choices: [{
          index: 0,
          delta: {
            role: 'assistant',
            content: accumulatedContent
          },
          finishReason
        }],
        created
      };
    } catch (error) {
      console.error('Google Gemini 发送流式聊天消息失败:', error);
      throw error;
    }
  }

  async sendCompletion(_prompt: string, _options?: SendOptions): Promise<any> {
    throw new Error('Google Gemini API 不支持 completion 模式。请使用 sendChatMessage 代替。');
  }

  async sendCompletionStream(
    _prompt: string,
    _options?: SendOptions,
    _onUpdate?: (chunk: any) => void
  ): Promise<any> {
    throw new Error('Google Gemini API 不支持 completion 模式。请使用 sendChatMessageStream 代替。');
  }

  // 映射完成原因
  private mapFinishReason(response: any): string {
    // Gemini API 的 finishReason 可能的值：
    // FINISH_REASON_UNSPECIFIED, STOP, MAX_TOKENS, SAFETY, RECITATION, OTHER
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const finishReason = candidates[0].finishReason;
      
      switch (finishReason) {
        case 'STOP':
          return 'stop';
        case 'MAX_TOKENS':
          return 'length';
        case 'SAFETY':
          return 'content_filter';
        case 'RECITATION':
          return 'content_filter';
        default:
          return 'stop';
      }
    }
    return 'stop';
  }

  // 估算 token 数量（简单估算：中文按字符数，英文按单词数 * 1.3）
  private estimateTokens(messages: ChatMessage[]): number {
    let totalChars = 0;
    let totalWords = 0;
    
    for (const message of messages) {
      const content = message.content;
      // 统计中文字符
      const chineseChars = content.match(/[\u4e00-\u9fa5]/g);
      totalChars += chineseChars ? chineseChars.length : 0;
      
      // 统计英文单词
      const englishWords = content.match(/[a-zA-Z]+/g);
      totalWords += englishWords ? englishWords.length : 0;
    }
    
    // 中文字符约等于 1 token，英文单词约等于 1.3 tokens
    return Math.ceil(totalChars + totalWords * 1.3);
  }
}

