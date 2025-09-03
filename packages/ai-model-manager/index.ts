// 导出主要组件
export { AIModelSelect } from './components/AIModelSelect';
export { AIModelConfModal } from './components/AIModelConfModal';
export { default as AIModelManagerComponent } from './components/AIModelManager';

// 导出类型定义
export type {
  AIModelConfig,
  AIProvider,
  AIProviderMeta,
  ProviderConfigField,
  AIModelSelectProps,
  AIModelConfModalProps,
  StorageConfig,
  AIModelManagerState,
  ThemeMode
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

// 导出样式（可选）
import './styles/index.css';

// 创建默认的管理器实例
import { createAIModelManager } from './utils/manager';
export const aiModelSelected = createAIModelManager({
  type: 'localStorage',
  localStorageKey: 'demo-local-configs'
});