import {
  AIModelSenderFactoryImpl,
  defaultSenderFactory,
  createAIModelSender,
  isProviderSupported
} from '@ai-model-application-suite/core/src/factory';
import { AIModelConfig, AIProvider } from '@ai-model-application-suite/core/src/types';

// Mock VolcengineAISender
jest.mock('@ai-model-application-suite/core/src/providers/volcengine', () => ({
  VolcengineAISender: jest.fn().mockImplementation(() => ({
    sendChatMessage: jest.fn(),
    sendChatMessageStream: jest.fn(),
    sendCompletion: jest.fn(),
    sendCompletionStream: jest.fn()
  }))
}));

describe('AIModelSenderFactory', () => {
  let factory: AIModelSenderFactoryImpl;
  let mockConfig: AIModelConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    factory = new AIModelSenderFactoryImpl();
    
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
  });

  describe('AIModelSenderFactoryImpl', () => {
    it('应该正确初始化工厂', () => {
      expect(factory).toBeInstanceOf(AIModelSenderFactoryImpl);
    });

    it('应该支持OpenAI提供商', () => {
      expect(factory.supportsProvider(AIProvider.OPENAI)).toBe(true);
    });

    it('应该支持Volcengine提供商', () => {
      expect(factory.supportsProvider(AIProvider.VOLCENGINE)).toBe(true);
    });

    it('应该返回所有支持的提供商', () => {
      const providers = factory.getSupportedProviders();
      
      expect(providers).toContain(AIProvider.OPENAI);
      expect(providers).toContain(AIProvider.VOLCENGINE);
    });

    it('应该正确创建OpenAI发送器', () => {
      const openaiConfig = {
        ...mockConfig,
        provider: AIProvider.OPENAI
      };
      
      const sender = factory.createSender(openaiConfig);
      
      expect(sender).toBeDefined();
      expect(sender.sendChatMessage).toBeDefined();
      expect(sender.sendChatMessageStream).toBeDefined();
      expect(sender.sendCompletion).toBeDefined();
      expect(sender.sendCompletionStream).toBeDefined();
    });

    it('应该正确创建Volcengine发送器', () => {
      const sender = factory.createSender(mockConfig);
      
      expect(sender).toBeDefined();
      expect(sender.sendChatMessage).toBeDefined();
      expect(sender.sendChatMessageStream).toBeDefined();
      expect(sender.sendCompletion).toBeDefined();
      expect(sender.sendCompletionStream).toBeDefined();
    });

    it('应该在不支持的提供商时抛出错误', () => {
      const unsupportedConfig = {
        ...mockConfig,
        provider: 'unsupported' as any
      };
      
      expect(() => factory.createSender(unsupportedConfig)).toThrow(
        '不支持的 AI 提供商: unsupported'
      );
    });

    it('应该支持注册新的提供商', () => {
      const mockSenderClass = jest.fn().mockImplementation(() => ({
        sendChatMessage: jest.fn(),
        sendChatMessageStream: jest.fn(),
        sendCompletion: jest.fn(),
        sendCompletionStream: jest.fn()
      }));
      
      factory.registerProvider('custom' as any, mockSenderClass);
      
      expect(factory.supportsProvider('custom' as any)).toBe(true);
      
      const customConfig = {
        ...mockConfig,
        provider: 'custom' as any
      };
      
      const sender = factory.createSender(customConfig);
      expect(sender).toBeDefined();
      expect(mockSenderClass).toHaveBeenCalledWith(customConfig);
    });

    it('应该支持覆盖现有提供商', () => {
      const mockSenderClass = jest.fn().mockImplementation(() => ({
        sendChatMessage: jest.fn(),
        sendChatMessageStream: jest.fn(),
        sendCompletion: jest.fn(),
        sendCompletionStream: jest.fn()
      }));
      
      factory.registerProvider(AIProvider.OPENAI, mockSenderClass);
      
      const sender = factory.createSender(mockConfig);
      expect(sender).toBeDefined();
      expect(mockSenderClass).toHaveBeenCalledWith(mockConfig);
    });
  });

  describe('defaultSenderFactory', () => {
    it('应该是AIModelSenderFactoryImpl的实例', () => {
      expect(defaultSenderFactory).toBeInstanceOf(AIModelSenderFactoryImpl);
    });

    it('应该支持OpenAI提供商', () => {
      expect(defaultSenderFactory.supportsProvider(AIProvider.OPENAI)).toBe(true);
    });

    it('应该支持Volcengine提供商', () => {
      expect(defaultSenderFactory.supportsProvider(AIProvider.VOLCENGINE)).toBe(true);
    });

    it('应该正确创建发送器', () => {
      const sender = defaultSenderFactory.createSender(mockConfig);
      
      expect(sender).toBeDefined();
      expect(sender.sendChatMessage).toBeDefined();
      expect(sender.sendChatMessageStream).toBeDefined();
      expect(sender.sendCompletion).toBeDefined();
      expect(sender.sendCompletionStream).toBeDefined();
    });
  });

  describe('createAIModelSender', () => {
    it('应该正确创建发送器', () => {
      const sender = createAIModelSender(mockConfig);
      
      expect(sender).toBeDefined();
      expect(sender.sendChatMessage).toBeDefined();
      expect(sender.sendChatMessageStream).toBeDefined();
      expect(sender.sendCompletion).toBeDefined();
      expect(sender.sendCompletionStream).toBeDefined();
    });

    it('应该使用默认工厂创建发送器', () => {
      const createSpy = jest.spyOn(defaultSenderFactory, 'createSender');
      
      createAIModelSender(mockConfig);
      
      expect(createSpy).toHaveBeenCalledWith(mockConfig);
      
      createSpy.mockRestore();
    });
  });

  describe('isProviderSupported', () => {
    it('应该正确检查OpenAI提供商支持', () => {
      expect(isProviderSupported(AIProvider.OPENAI)).toBe(true);
    });

    it('应该正确检查Volcengine提供商支持', () => {
      expect(isProviderSupported(AIProvider.VOLCENGINE)).toBe(true);
    });

    it('应该正确检查不支持的提供商', () => {
      expect(isProviderSupported('unsupported' as any)).toBe(false);
    });

    it('应该使用默认工厂检查提供商支持', () => {
      const supportsSpy = jest.spyOn(defaultSenderFactory, 'supportsProvider');
      
      isProviderSupported(AIProvider.OPENAI);
      
      expect(supportsSpy).toHaveBeenCalledWith(AIProvider.OPENAI);
      
      supportsSpy.mockRestore();
    });
  });

  describe('错误处理', () => {
    it('应该处理创建发送器时的错误', () => {
      const invalidConfig = {
        ...mockConfig,
        provider: 'invalid' as any
      };
      
      expect(() => factory.createSender(invalidConfig)).toThrow(
        '不支持的 AI 提供商: invalid'
      );
    });

    it('应该处理注册提供商时的错误', () => {
      const mockSenderClass = jest.fn().mockImplementation(() => {
        throw new Error('初始化错误');
      });
      
      factory.registerProvider('error' as any, mockSenderClass);
      
      const errorConfig = {
        ...mockConfig,
        provider: 'error' as any
      };
      
      expect(() => factory.createSender(errorConfig)).toThrow('初始化错误');
    });
  });

  describe('集成测试', () => {
    it('应该能够完整地创建和使用发送器', async () => {
      const mockSender = {
        sendChatMessage: jest.fn().mockResolvedValue({
          id: 'test-id',
          model: 'gpt-4',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: '测试回复'
            },
            finishReason: 'stop'
          }],
          usage: {
            promptTokens: 10,
            completionTokens: 5,
            totalTokens: 15
          },
          created: 1234567890
        }),
        sendChatMessageStream: jest.fn(),
        sendCompletion: jest.fn(),
        sendCompletionStream: jest.fn()
      };

      const VolcengineAISender = require('../../../packages/ai_model_application_suite/src/providers/volcengine').VolcengineAISender;
      VolcengineAISender.mockImplementation(() => mockSender);

      const sender = createAIModelSender(mockConfig);
      
      const messages = [
        { role: 'user' as const, content: '你好' }
      ];
      
      const result = await sender.sendChatMessage(messages);
      
      expect(result.id).toBe('test-id');
      expect(result.model).toBe('gpt-4');
      expect(result.choices[0].message.content).toBe('测试回复');
      expect(mockSender.sendChatMessage).toHaveBeenCalledWith(messages, undefined);
    });

    it('应该支持多个不同的配置', () => {
      const config1 = {
        ...mockConfig,
        provider: AIProvider.OPENAI,
        config: { apiKey: 'openai-key' }
      };
      
      const config2 = {
        ...mockConfig,
        provider: AIProvider.VOLCENGINE,
        config: { apiKey: 'volcengine-key' }
      };
      
      const sender1 = createAIModelSender(config1);
      const sender2 = createAIModelSender(config2);
      
      expect(sender1).toBeDefined();
      expect(sender2).toBeDefined();
      expect(sender1).not.toBe(sender2);
    });
  });
});
