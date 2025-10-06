/**
 * 国际化支持
 * 支持中文和英文，默认英文
 */

export type Locale = 'en' | 'zh';

export interface I18nMessages {
  // AIModelSelect 相关
  selectPlaceholder: string;
  noModelsAvailable: string;
  addModel: string;
  selectModel: string;
  
  // AIModelConfModal 相关
  addAIModel: string;
  editAIModel: string;
  configName: string;
  configNamePlaceholder: string;
  configNameHelper: string;
  aiProvider: string;
  modelId: string;
  modelIdPlaceholder: string;
  modelIdHelper: string;
  apiKey: string;
  apiKeyPlaceholder: string;
  apiKeyHelper: string;
  baseURL: string;
  baseURLPlaceholder: string;
  extraJsonParams: string;
  extraJsonParamsPlaceholder: string;
  enabledStatus: string;
  enabled: string;
  disabled: string;
  cancel: string;
  save: string;
  saving: string;
  formatJson: string;
  validateJson: string;
  validationSuccess: string;
  validationSuccessMsg: string;
  validationError: string;
  validationErrorMsg: string;
  jsonFormatInvalid: string;
  configNameRequired: string;
  manageConfigs: string;
  clickToExpand: string;
  clickToCollapse: string;
  
  // AIModelManager 相关
  aiModelManager: string;
  modelName: string;
  provider: string;
  status: string;
  actions: string;
  edit: string;
  delete: string;
  confirmDelete: string;
  confirmDeleteMessage: string;
  noConfigs: string;
  clickAddToCreate: string;
  close: string;
  
  // 通用
  required: string;
}

const EN_MESSAGES: I18nMessages = {
  // AIModelSelect
  selectPlaceholder: 'Select an AI model...',
  noModelsAvailable: 'No models available',
  addModel: 'Add AI Model',
  selectModel: 'Select AI Model',
  
  // AIModelConfModal
  addAIModel: 'Add AI Model',
  editAIModel: 'Edit AI Model',
  configName: 'Configuration Name',
  configNamePlaceholder: 'Enter configuration name, e.g., My GPT-4 Config',
  configNameHelper: 'This is your custom configuration name for identifying different AI model configurations',
  aiProvider: 'AI Provider',
  modelId: 'AI Model',
  modelIdPlaceholder: 'Enter or select AI model',
  modelIdHelper: 'This is the specific model ID passed to the AI service provider, e.g., gpt-4, deepseek-v3-1-250821, etc.',
  apiKey: 'API Key',
  apiKeyPlaceholder: '',
  apiKeyHelper: 'Your AI service provider API key for authentication',
  baseURL: 'Base URL',
  baseURLPlaceholder: 'https://',
  extraJsonParams: 'Extra JSON Parameters',
  extraJsonParamsPlaceholder: 'Enter extra JSON parameters, e.g., temperature=1, top_p=0.7, max_tokens=32768',
  enabledStatus: 'Enabled Status',
  enabled: 'Enabled',
  disabled: 'Disabled',
  cancel: 'Cancel',
  save: 'Save',
  saving: 'Saving...',
  formatJson: '🔧 Format JSON',
  validateJson: '✅ Validate JSON',
  validationSuccess: '✅ Validation Successful',
  validationSuccessMsg: '✓ JSON format is correct',
  validationError: 'Validation Error',
  validationErrorMsg: '✗ JSON format is invalid',
  jsonFormatInvalid: 'Invalid JSON format',
  configNameRequired: 'Configuration name cannot be empty',
  manageConfigs: 'Manage Configs',
  clickToExpand: 'Click to expand',
  clickToCollapse: 'Click to collapse',
  
  // AIModelManager
  aiModelManager: 'AI Model Manager',
  modelName: 'Model Name',
  provider: 'Provider',
  status: 'Status',
  actions: 'Actions',
  edit: 'Edit',
  delete: 'Delete',
  confirmDelete: 'Confirm Delete',
  confirmDeleteMessage: 'Are you sure you want to delete this configuration?',
  noConfigs: 'No configurations yet',
  clickAddToCreate: 'Click "Add AI Model" to create a new configuration',
  close: 'Close',
  
  // Common
  required: 'Required',
};

const ZH_MESSAGES: I18nMessages = {
  // AIModelSelect
  selectPlaceholder: '请选择AI模型',
  noModelsAvailable: '暂无可用模型',
  addModel: '添加AI模型',
  selectModel: '选择AI模型',
  
  // AIModelConfModal
  addAIModel: '添加AI模型',
  editAIModel: '编辑AI模型',
  configName: '配置名称',
  configNamePlaceholder: '输入配置名称，如：我的GPT-4配置',
  configNameHelper: '这是您自定义的配置名称，用于识别不同的AI模型配置',
  aiProvider: 'AI提供商',
  modelId: 'AI模型',
  modelIdPlaceholder: '输入或选择AI模型',
  modelIdHelper: '这是传递给AI服务商的具体模型ID，如：gpt-4、deepseek-v3-1-250821等',
  apiKey: 'API Key',
  apiKeyPlaceholder: '',
  apiKeyHelper: '您的AI服务商API密钥，用于身份验证',
  baseURL: 'Base URL',
  baseURLPlaceholder: 'https://',
  extraJsonParams: '额外JSON参数',
  extraJsonParamsPlaceholder: '输入额外的JSON参数，如：temperature=1, top_p=0.7, max_tokens=32768',
  enabledStatus: '启用状态',
  enabled: '已启用',
  disabled: '已禁用',
  cancel: '取消',
  save: '保存',
  saving: '保存中...',
  formatJson: '🔧 格式化JSON',
  validateJson: '✅ 验证JSON',
  validationSuccess: '✅ 验证成功',
  validationSuccessMsg: '✓ JSON格式正确',
  validationError: '验证错误',
  validationErrorMsg: '✗ JSON格式错误',
  jsonFormatInvalid: 'JSON格式无效',
  configNameRequired: '配置名称不能为空',
  manageConfigs: '管理配置',
  clickToExpand: '点击展开',
  clickToCollapse: '点击折叠',
  
  // AIModelManager
  aiModelManager: 'AI模型管理器',
  modelName: '模型名称',
  provider: '提供商',
  status: '状态',
  actions: '操作',
  edit: '编辑',
  delete: '删除',
  confirmDelete: '确认删除',
  confirmDeleteMessage: '确定要删除这个配置吗？',
  noConfigs: '暂无配置',
  clickAddToCreate: '点击"添加AI模型"创建新配置',
  close: '关闭',
  
  // Common
  required: '必填',
};

const MESSAGES: Record<Locale, I18nMessages> = {
  en: EN_MESSAGES,
  zh: ZH_MESSAGES,
};

export const getMessages = (locale: Locale = 'en'): I18nMessages => {
  return MESSAGES[locale] || MESSAGES.en;
};

export const t = (key: keyof I18nMessages, locale: Locale = 'en'): string => {
  const messages = getMessages(locale);
  return messages[key] || key;
};

