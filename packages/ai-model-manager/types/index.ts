// AI模型配置类型定义
export interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  apiKey?: string;
  baseURL?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  // 扩展配置，支持各AI提供商特有的配置项
  config?: Record<string, any>;
}

// 主题类型
export type ThemeMode = 'light' | 'dark' | 'system';

// 支持的AI提供商
export enum AIProvider {
  OPENAI = 'openai',
  OPENAILIKE = 'openailike',
  DEEPSEEK = 'deepseek',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  MISTRAL = 'mistral',
  COHERE = 'cohere',
  AZURE = 'azure',
  OLLAMA = 'ollama',
  VOLCENGINE = 'volcengine',
  CUSTOM = 'custom'
}

// AI提供商元数据
export interface AIProviderMeta {
  id: AIProvider;
  name: string;
  description: string;
  npmPackage?: string; // 对应的npm包名
  requiresApiKey: boolean;
  defaultBaseURL?: string;
  configFields?: ProviderConfigField[];
  // 支持的模型列表
  models?: string[];
}

// 提供商配置字段
export interface ProviderConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'select' | 'boolean' | 'autocomplete' | 'jsonarea';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  suggestions?: string[]; // 用于autocomplete类型的建议列表
  defaultValue?: any;
  collapsible?: boolean; // 是否可折叠
  defaultCollapsed?: boolean; // 默认是否折叠
}

// 组件Props类型
export interface AIModelSelectProps {
  // 显示模式：'select' 下拉选择模式 | 'list' 列表模式
  mode?: 'select' | 'list';
  // 当前选中的模型ID
  selectedModelId?: string;
  // 模型选择变化回调
  onModelChange?: (modelId: string) => void;
  // 模型配置变化回调
  onConfigChange?: (configs: AIModelConfig[]) => void;
  // 主题模式：light | dark | system
  theme?: ThemeMode;
  // 自定义样式类名
  className?: string;
  // 自定义样式类名（用于主色调等样式）
  customClassName?: string;
  // 主色调样式对象
  primaryColorStyles?: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    primaryGlow: string;
  };
  // 内联样式
  style?: React.CSSProperties;
  // 数据存储方式配置
  storage?: StorageConfig;
  // 支持的AI提供商配置
  supportedProviders?: AIProvider[];
  // 自定义提供商元数据
  customProviders?: AIProviderMeta[];
  // 是否显示添加按钮
  showAddButton?: boolean;
  // 添加按钮文本
  addButtonText?: string;
  // 是否允许删除模型
  allowDelete?: boolean;
  // 下拉模式的占位符文本
  placeholder?: string;
  // AI模型选择器实例
  manager?: any;
}

export interface AIModelConfModalProps {
  // 是否显示弹窗
  visible: boolean;
  // 关闭弹窗回调
  onClose: () => void;
  // 正在编辑的模型配置（undefined表示新增）
  editingModel?: AIModelConfig;
  // 保存配置回调
  onSave: (config: AIModelConfig) => void;
  // 支持的AI提供商
  supportedProviders: AIProviderMeta[];
  // 自定义样式类名
  className?: string;
  // 自定义样式类名（用于主色调等样式）
  customClassName?: string;
  // 内联样式
  style?: React.CSSProperties;
  // 显示管理配置按钮回调
  onShowManager?: () => void;
}

// 数据存储配置
export interface StorageConfig {
  // 存储类型：'localStorage' | 'api' | 'custom'
  type: 'localStorage' | 'api' | 'custom';
  // localStorage key (当type为localStorage时使用)
  localStorageKey?: string;
  // API配置 (当type为api时使用)
  api?: {
    // 获取配置列表的API
    getConfigs: () => Promise<AIModelConfig[]>;
    // 保存配置的API
    saveConfig: (config: AIModelConfig) => Promise<AIModelConfig>;
    // 删除配置的API
    deleteConfig: (id: string) => Promise<void>;
    // 更新配置的API
    updateConfig: (id: string, config: Partial<AIModelConfig>) => Promise<AIModelConfig>;
  };
  // 自定义存储处理器 (当type为custom时使用)
  custom?: {
    load: () => Promise<AIModelConfig[]> | AIModelConfig[];
    save: (configs: AIModelConfig[]) => Promise<void> | void;
  };
}

// 内部状态管理
export interface AIModelManagerState {
  configs: AIModelConfig[];
  selectedModelId?: string;
  loading: boolean;
  error?: string;
}