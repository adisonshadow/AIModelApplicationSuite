// 导出主要类型和接口
export type {
  AIModelConfig,
  AIProvider,
  AIModelSender,
  AIModelSenderFactory,
  ChatMessage,
  SendOptions,
  ChatResponse,
  ChatStreamResponse,
  CompletionResponse,
  CompletionStreamResponse
} from './types';

// 导出工厂实现
export { AIModelSenderFactoryImpl, defaultSenderFactory } from './factory';

// 导出便捷函数
export { createAIModelSender, isProviderSupported } from './factory';

// 导出具体的发送器实现
export { VolcengineAISender } from './providers/volcengine';

// 默认导出工厂实例
import { defaultSenderFactory } from './factory';
export default defaultSenderFactory;
