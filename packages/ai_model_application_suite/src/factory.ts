import { AIModelConfig, SimpleAIConfig, AIProvider, AIModelSender, AIModelSenderFactory } from './types';
import { VolcengineAISender } from './providers/volcengine';
import { AliyunBailianAISender } from './providers/aliyun_bailian';
import { OpenAICompatibleSender } from './providers/openai_compatible';
import { GoogleGeminiSender } from './providers/google_gemini';

// AI 模型发送器工厂
export class AIModelSenderFactoryImpl implements AIModelSenderFactory {
  private providers = new Map<AIProvider, new (config: AIModelConfig) => AIModelSender>();

  constructor() {
    // 注册支持的提供商
    this.registerProvider(AIProvider.OPENAI, OpenAICompatibleSender);
    this.registerProvider(AIProvider.VOLCENGINE, VolcengineAISender);
    this.registerProvider(AIProvider.ALIYUN_BAILIAN, AliyunBailianAISender);
    this.registerProvider(AIProvider.GOOGLE, GoogleGeminiSender);
  }

  // 注册新的提供商
  registerProvider(provider: AIProvider, senderClass: new (config: AIModelConfig) => AIModelSender) {
    this.providers.set(provider, senderClass);
  }

  // 创建发送器实例
  createSender(config: AIModelConfig): AIModelSender {
    const SenderClass = this.providers.get(config.provider);
    if (!SenderClass) {
      throw new Error(`不支持的 AI 提供商: ${config.provider}`);
    }
    return new SenderClass(config);
  }

  // 从简化配置创建发送器实例
  createSenderFromSimpleConfig(simpleConfig: SimpleAIConfig): AIModelSender {
    const fullConfig: AIModelConfig = {
      id: 'simple-' + Date.now(),
      name: 'Simple Config',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...simpleConfig,
    };
    return this.createSender(fullConfig);
  }

  // 检查是否支持指定的提供商
  supportsProvider(provider: AIProvider): boolean {
    return this.providers.has(provider);
  }

  // 获取所有支持的提供商
  getSupportedProviders(): AIProvider[] {
    return Array.from(this.providers.keys());
  }
}

// 创建默认工厂实例
export const defaultSenderFactory = new AIModelSenderFactoryImpl();

// 便捷函数：直接创建发送器
export function createAIModelSender(config: AIModelConfig | SimpleAIConfig): AIModelSender {
  // 检查是否包含管理字段来区分配置类型
  if ('id' in config && 'enabled' in config && 'createdAt' in config) {
    return defaultSenderFactory.createSender(config as AIModelConfig);
  } else {
    return defaultSenderFactory.createSenderFromSimpleConfig(config as SimpleAIConfig);
  }
}

// 便捷函数：检查提供商是否支持
export function isProviderSupported(provider: AIProvider): boolean {
  return defaultSenderFactory.supportsProvider(provider);
}
