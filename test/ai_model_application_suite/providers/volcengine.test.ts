import { VolcengineAISender } from '../../../packages/ai_model_application_suite/src/providers/volcengine';
import { AIModelConfig, AIProvider, ChatMessage } from '../../../packages/ai_model_application_suite/src/types';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      },
      completions: {
        create: jest.fn()
      }
    }))
  };
});

describe('VolcengineAISender', () => {
  let mockConfig: AIModelConfig;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = {
      id: 'test-config',
      name: '测试配置',
      provider: AIProvider.VOLCENGINE,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {
        apiKey: 'test-api-key',
        baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
        model: 'gpt-4'
      }
    };

    // Mock OpenAI client
    const OpenAI = require('openai').default;
    mockClient = {
      chat: {
        completions: {
          create: jest.fn()
        }
      },
      completions: {
        create: jest.fn()
      }
    };
    OpenAI.mockImplementation(() => mockClient);
  });

  describe('构造函数', () => {
    it('应该正确初始化Volcengine发送器', () => {
      const sender = new VolcengineAISender(mockConfig);
      
      expect(sender).toBeInstanceOf(VolcengineAISender);
    });

    it('应该支持OpenAI提供商', () => {
      const openaiConfig = {
        ...mockConfig,
        provider: AIProvider.OPENAI
      };
      
      const sender = new VolcengineAISender(openaiConfig);
      
      expect(sender).toBeInstanceOf(VolcengineAISender);
    });

    it('应该在不支持的提供商时抛出错误', () => {
      const unsupportedConfig = {
        ...mockConfig,
        provider: 'unsupported' as any
      };
      
      expect(() => new VolcengineAISender(unsupportedConfig)).toThrow(
        '不支持的 AI 提供商: unsupported'
      );
    });
  });

  describe('sendChatMessage', () => {
    it('应该正确发送聊天消息', async () => {
      const mockResponse = {
        id: 'chat-response-id',
        model: 'gpt-4',
        choices: [{
          message: {
            content: '测试回复'
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        },
        created: 1234567890
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      const sender = new VolcengineAISender(mockConfig);
      const messages: ChatMessage[] = [
        { role: 'user', content: '你好' }
      ];

      const result = await sender.sendChatMessage(messages);

      expect(result.id).toBe('chat-response-id');
      expect(result.model).toBe('gpt-4');
      expect(result.choices[0].message.content).toBe('测试回复');
      expect(result.usage.promptTokens).toBe(10);
      expect(result.usage.completionTokens).toBe(5);
      expect(result.usage.totalTokens).toBe(15);
    });

    it('应该支持额外的JSON参数', async () => {
      const configWithJsonParams = {
        ...mockConfig,
        config: {
          ...mockConfig.config,
          jsonParams: '{"temperature": 0.8, "max_tokens": 2000}'
        }
      };

      const mockResponse = {
        id: 'chat-response-id',
        model: 'gpt-4',
        choices: [{
          message: {
            content: '测试回复'
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        },
        created: 1234567890
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      const sender = new VolcengineAISender(configWithJsonParams);
      const messages: ChatMessage[] = [
        { role: 'user', content: '你好' }
      ];

      await sender.sendChatMessage(messages);

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.8,
          max_tokens: 2000
        })
      );
    });

    it('应该处理无效的JSON参数', async () => {
      const configWithInvalidJson = {
        ...mockConfig,
        config: {
          ...mockConfig.config,
          jsonParams: 'invalid-json'
        }
      };

      const mockResponse = {
        id: 'chat-response-id',
        model: 'gpt-4',
        choices: [{
          message: {
            content: '测试回复'
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        },
        created: 1234567890
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      const sender = new VolcengineAISender(configWithInvalidJson);
      const messages: ChatMessage[] = [
        { role: 'user', content: '你好' }
      ];

      // 应该不会抛出错误，而是忽略无效的JSON
      await expect(sender.sendChatMessage(messages)).resolves.toBeDefined();
    });

    it('应该处理API错误', async () => {
      mockClient.chat.completions.create.mockRejectedValue(new Error('API错误'));

      const sender = new VolcengineAISender(mockConfig);
      const messages: ChatMessage[] = [
        { role: 'user', content: '你好' }
      ];

      await expect(sender.sendChatMessage(messages)).rejects.toThrow('API错误');
    });

    it('应该处理无效的响应格式', async () => {
      const mockInvalidResponse = {
        id: 'chat-response-id',
        model: 'gpt-4',
        choices: [] // 空的choices数组
      };

      mockClient.chat.completions.create.mockResolvedValue(mockInvalidResponse);

      const sender = new VolcengineAISender(mockConfig);
      const messages: ChatMessage[] = [
        { role: 'user', content: '你好' }
      ];

      await expect(sender.sendChatMessage(messages)).rejects.toThrow('AI 响应格式错误');
    });
  });

  describe('sendChatMessageStream', () => {
    it('应该正确发送流式聊天消息', async () => {
      const mockStreamResponse = {
        id: 'stream-response-id',
        model: 'gpt-4',
        choices: [{
          delta: {
            content: '流式'
          }
        }]
      };

      // Mock async iterator
      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          yield mockStreamResponse;
          yield {
            id: 'stream-response-id',
            model: 'gpt-4',
            choices: [{
              delta: {
                content: '回复'
              }
            }]
          };
        }
      };

      mockClient.chat.completions.create.mockReturnValue(mockAsyncIterator);

      const sender = new VolcengineAISender(mockConfig);
      const messages: ChatMessage[] = [
        { role: 'user', content: '你好' }
      ];

      const result = await sender.sendChatMessageStream(messages);

      expect(result.id).toBe('stream-response-id');
      expect(result.model).toBe('gpt-4');
      expect(result.choices[0].delta.content).toBe('流式回复');
    });

    it('应该支持onUpdate回调', async () => {
      const onUpdate = jest.fn();
      const mockStreamResponse = {
        id: 'stream-response-id',
        model: 'gpt-4',
        choices: [{
          delta: {
            content: '流式回复'
          }
        }]
      };

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          yield mockStreamResponse;
        }
      };

      mockClient.chat.completions.create.mockReturnValue(mockAsyncIterator);

      const sender = new VolcengineAISender(mockConfig);
      const messages: ChatMessage[] = [
        { role: 'user', content: '你好' }
      ];

      await sender.sendChatMessageStream(messages, undefined, onUpdate);

      expect(onUpdate).toHaveBeenCalledWith(mockStreamResponse);
    });
  });

  describe('sendCompletion', () => {
    it('应该正确发送补全请求', async () => {
      const mockResponse = {
        choices: [{
          text: '补全文本'
        }],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 3,
          total_tokens: 8
        }
      };

      mockClient.completions.create.mockResolvedValue(mockResponse);

      const sender = new VolcengineAISender(mockConfig);
      const result = await sender.sendCompletion('测试提示');

      expect(result.text).toBe('补全文本');
      expect(result.usage.promptTokens).toBe(5);
      expect(result.usage.completionTokens).toBe(3);
      expect(result.usage.totalTokens).toBe(8);
    });

    it('应该处理补全请求错误', async () => {
      mockClient.completions.create.mockRejectedValue(new Error('补全错误'));

      const sender = new VolcengineAISender(mockConfig);

      await expect(sender.sendCompletion('测试提示')).rejects.toThrow('补全错误');
    });
  });

  describe('sendCompletionStream', () => {
    it('应该正确发送流式补全请求', async () => {
      const mockStreamResponse = {
        choices: [{
          text: '流式补全'
        }]
      };

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          yield mockStreamResponse;
          yield {
            choices: [{
              text: '文本'
            }]
          };
        }
      };

      mockClient.completions.create.mockReturnValue(mockAsyncIterator);

      const sender = new VolcengineAISender(mockConfig);
      const result = await sender.sendCompletionStream('测试提示');

      expect(result.text).toBe('流式补全文本');
      expect(result.done).toBe(true);
    });
  });

  describe('配置处理', () => {
    it('应该使用默认的baseURL', () => {
      const configWithoutBaseURL = {
        ...mockConfig,
        config: {
          apiKey: 'test-key'
        }
      };

      const sender = new VolcengineAISender(configWithoutBaseURL);
      expect(sender).toBeInstanceOf(VolcengineAISender);
    });

    it('应该使用配置中的模型', async () => {
      const mockResponse = {
        id: 'chat-response-id',
        model: 'custom-model',
        choices: [{
          message: {
            content: '测试回复'
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        },
        created: 1234567890
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      const sender = new VolcengineAISender(mockConfig);
      const messages: ChatMessage[] = [
        { role: 'user', content: '你好' }
      ];

      await sender.sendChatMessage(messages);

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4'
        })
      );
    });

    it('应该支持选项中的模型覆盖', async () => {
      const mockResponse = {
        id: 'chat-response-id',
        model: 'gpt-4',
        choices: [{
          message: {
            content: '测试回复'
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        },
        created: 1234567890
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      const sender = new VolcengineAISender(mockConfig);
      const messages: ChatMessage[] = [
        { role: 'user', content: '你好' }
      ];

      await sender.sendChatMessage(messages, { model: 'gpt-3.5-turbo' });

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo'
        })
      );
    });
  });
});
