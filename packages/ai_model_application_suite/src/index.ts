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
  CompletionStreamResponse,
  AutoContinueState
} from './types';

// 导出工具函数
export {
  StorageManager,
  createStorageManager,
  generateId
} from './utils/storage';

export {
  AutoContinueManager
} from './utils/AutoContinueManager';

export {
  DEFAULT_PROVIDERS,
  getProviderMeta,
  getAllProviders,
  validateProviderConfig
} from './utils/providers';

// 导出新的全局管理器（推荐）
export {
  GlobalAIModelManager,
  getGlobalAIModelManager,
  globalAIModelManager
} from './utils/GlobalAIModelManager';

// 导出AI事件管理器
export {
  AIEventManager,
  getAIEventManager,
  aiEventManager
} from './utils/AIEventManager';

// 导出React Hooks
export {
  useAIModel,
  useCurrentAIModel,
  useAIModelConfigs
} from './hooks/useAIModel';

export {
  useAIEvents,
  useConversation,
  useStreaming
} from './hooks/useAIEvents';

// 导出管理器（弃用）
/** @deprecated 请使用 GlobalAIModelManager 替代，将在 v1.0.0 中移除 */
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

// 创建默认的管理器实例（弃用）
/** @deprecated 请使用 globalAIModelManager 替代，将在 v1.0.0 中移除 */
import { createAIModelManager } from './utils/manager';
export const aiModelSelected = createAIModelManager({
  type: 'localStorage',
  localStorageKey: 'ai-model-configss'
});

// 默认导出工厂实例
import { defaultSenderFactory } from './factory';
export default defaultSenderFactory;
