// AI Model Application Suite - 统一入口文件

// 导出主要组件
export { AIModelSelect } from './components/AIModelSelect';
export { AIModelConfModal } from './components/AIModelConfModal';
export { default as AIModelManagerComponent } from './components/AIModelManager';

// 导出值和类型
export { AIProvider } from './types';

// 导出类型定义
export type {
  AIModelConfig,
  AIProviderMeta,
  ProviderConfigField,
  AIModelSelectProps,
  AIModelConfModalProps,
  AIModelManagerProps,
  StorageConfig,
  AIModelManagerState,
  ThemeMode,
  AIModelSender,
  AIModelSenderFactory,
  ChatMessage,
  SendOptions,
  ChatResponse,
  ChatStreamResponse,
  CompletionResponse,
  CompletionStreamResponse
} from './types';

// 导出工具函数
export {
  StorageManager,
  createStorageManager,
  generateId
} from './utils/storage';

export {
  DEFAULT_PROVIDERS,
  getProviderMeta,
  getAllProviders,
  validateProviderConfig
} from './utils/providers';

// 导出管理器
export {
  AIModelManager,
  createAIModelManager
} from './utils/manager';

// 导出AI发送器相关
export {
  AIModelSenderFactoryImpl,
  defaultSenderFactory,
  createAIModelSender,
  isProviderSupported
} from './factory';

// 导出具体的发送器实现
export { VolcengineAISender } from './providers/volcengine';

// 导出样式（可选）
import './styles/index.css';

// 创建默认的管理器实例
import { createAIModelManager } from './utils/manager';
export const aiModelSelected = createAIModelManager({
  type: 'localStorage',
  localStorageKey: 'demo-local-configs'
});

// 默认导出工厂实例
import { defaultSenderFactory } from './factory';
export default defaultSenderFactory;
