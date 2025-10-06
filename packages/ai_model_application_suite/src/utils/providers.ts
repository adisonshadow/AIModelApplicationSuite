import { AIProvider, AIProviderMeta } from '../types';

// 预定义的AI提供商配置
export const getDefaultProviders = (locale: 'en' | 'zh' = 'en'): AIProviderMeta[] => {
  return [
  {
    id: AIProvider.OPENAI,
    name: 'OpenAI',
    description: 'OpenAI GPT models (GPT-4, GPT-3.5, etc.)',
    npmPackage: 'openai (default)',
    requiresApiKey: true,
    defaultBaseURL: 'https://api.openai.com/v1',
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'sk-...'
      },
      {
        key: 'model',
        label: locale === 'zh' ? 'AI模型' : 'Model',
        type: 'autocomplete',
        required: true,
        placeholder: locale === 'zh' ? '输入或选择AI模型，如：gpt-4' : 'Enter or select AI model, e.g.: gpt-4',
        suggestions: [
          'gpt-4-turbo',
          'gpt-4',
          'gpt-3.5-turbo',
          'gpt-3.5-turbo-16k'
        ]
      }
    ]
  },
  {
    id: AIProvider.OPENAILIKE,
    name: locale === 'zh' ? '兼容OpenAI协议的AI模型' : 'OpenAI Compatible',
    description: 'OpenAI GPT models (GPT-4, GPT-3.5, etc.)',
    npmPackage: 'openai (default)',
    requiresApiKey: true,
    defaultBaseURL: '',
    models: [],
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: ''
      },
      {
        key: 'baseURL',
        label: 'Base URL',
        type: 'url',
        required: true,
        placeholder: 'https://',
        defaultValue: ''
      },
      {
        key: 'model',
        label: locale === 'zh' ? 'AI模型' : 'Model',
        type: 'autocomplete',
        required: true,
        placeholder: locale === 'zh' ? '输入或选择AI模型' : 'Enter or select AI model',
        suggestions: []
      }
    ]
  },
  {
    id: AIProvider.DEEPSEEK,
    name: 'DeepSeek',
    description: 'DeepSeek AI models',
    npmPackage: 'openai (default)',
    requiresApiKey: true,
    defaultBaseURL: 'https://api.deepseek.com/v1',
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'sk-...'
      },
      {
        key: 'model',
        label: locale === 'zh' ? 'AI模型' : 'Model',
        type: 'autocomplete',
        required: true,
        placeholder: locale === 'zh' ? '输入或选择AI模型' : 'Enter or select AI model',
        suggestions: [
          'deepseek-chat',
          'deepseek-coder',
          'deepseek-v3',
          'deepseek-r1'
        ]
      }
    ]
  },
  {
    id: AIProvider.ANTHROPIC,
    name: 'Anthropic',
    description: 'Anthropic Claude models',
    npmPackage: '- (no implementation planned, not developer-friendly)',
    requiresApiKey: true,
    defaultBaseURL: 'https://api.anthropic.com',
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'sk-ant-...'
      },
      {
        key: 'model',
        label: locale === 'zh' ? 'AI模型' : 'Model',
        type: 'autocomplete',
        required: true,
        placeholder: locale === 'zh' ? '输入或选择AI模型' : 'Enter or select AI model',
        suggestions: [
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307',
          'claude-2.1',
          'claude-2.0'
        ]
      }
    ]
  },
  {
    id: AIProvider.GOOGLE,
    name: 'Google Gemini',
    description: 'Google Gemini models (Gemini Pro, Gemini 1.5, etc.)',
    npmPackage: '@google/genai',
    requiresApiKey: true,
    defaultBaseURL: 'https://generativelanguage.googleapis.com/v1beta',
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'AIza...'
      },
      {
        key: 'model',
        label: locale === 'zh' ? 'AI模型' : 'Model',
        type: 'autocomplete',
        required: true,
        placeholder: locale === 'zh' ? '输入或选择AI模型，如：gemini-pro' : 'Enter or select AI model, e.g.: gemini-pro',
        suggestions: [
          'gemini-2.0-flash-exp',
          'gemini-1.5-pro',
          'gemini-1.5-flash',
          'gemini-pro',
          'gemini-pro-vision'
        ]
      }
    ]
  },
  {
    id: AIProvider.AZURE,
    name: 'Azure OpenAI',
    description: 'Azure OpenAI Service',
    npmPackage: 'openai (default)',
    requiresApiKey: true,
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'your-azure-api-key'
      },
      {
        key: 'resourceName',
        label: 'Resource Name',
        type: 'text',
        required: true,
        placeholder: 'your-resource-name'
      },
      {
        key: 'deploymentName',
        label: 'Deployment Name',
        type: 'text',
        required: true,
        placeholder: 'your-deployment-name'
      },
      {
        key: 'apiVersion',
        label: 'API Version',
        type: 'select',
        required: false,
        defaultValue: '2023-12-01-preview',
        options: [
          { label: '2023-12-01-preview', value: '2023-12-01-preview' },
          { label: '2023-06-01-preview', value: '2023-06-01-preview' },
          { label: '2023-05-15', value: '2023-05-15' }
        ]
      }
    ]
  },
  {
    id: AIProvider.OLLAMA,
    name: 'Ollama',
    description: 'Local Ollama models',
    npmPackage: 'openai (default)',
    requiresApiKey: false,
    defaultBaseURL: 'http://localhost:11434',
    configFields: [
      {
        key: 'baseURL',
        label: 'Base URL',
        type: 'url',
        required: false,
        placeholder: 'http://localhost:11434',
        defaultValue: 'http://localhost:11434'
      }
    ]
  },
  {
    id: AIProvider.VOLCENGINE,
    name: locale === 'zh' ? 'Volcengine火山引擎' : 'Volcengine',
    description: 'Volcengine AI models (OpenAI compatible)',
    npmPackage: 'Built-in implementation',
    requiresApiKey: true,
    defaultBaseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: ''
      },
      {
        key: 'model',
        label: locale === 'zh' ? 'AI模型' : 'Model',
        type: 'autocomplete',
        required: true,
        placeholder: locale === 'zh' ? '输入或选择AI模型，如：gpt-4' : 'Enter or select AI model, e.g.: gpt-4',
        suggestions: [
          'doubao-seed-1-6-250615',
          'doubao-seed-1-6-thinking-250715',
          'doubao-seed-1-6-flash-250828',
          'deepseek-v3-1-terminus',
          'deepseek-r1-250528',
          'kimi-k2-250905',
          'doubao-seed-translation-250915', // Translation
          'doubao-1-5-pro-32k-250115'
        ]
      }
    ]
  },
  {
    id: AIProvider.ALIYUN_BAILIAN,
    name: locale === 'zh' ? '阿里云百炼' : 'Aliyun Bailian',
    description: locale === 'zh' ? '阿里云百炼 AI models (OpenAI compatible)' : 'Aliyun Bailian AI models (OpenAI compatible)',
    npmPackage: 'Built-in implementation',
    requiresApiKey: true,
    defaultBaseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: ''
      },
      {
        key: 'model',
        label: locale === 'zh' ? 'AI模型' : 'Model',
        type: 'autocomplete',
        required: true,
        placeholder: locale === 'zh' ? '输入或选择AI模型' : 'Enter or select AI model',
        suggestions: [
          'qwen3-max',
          'deepseek-v3.2-exp',
          'qwen-plus-32k-latest',
          'qwen-turbo-latest',
          'qwen-turbo-32k-latest',
          'qwen-plus-14b-latest',
          'qwen-plus-14b-32k-latest',
          'qwen-turbo-14b-latest',
          'qwen-turbo-14b-32k-latest',
          'deepseek-v3-1',
          'deepseek-r1',
          'Moonshot-Kimi-K2-Instruct'
        ]
      }
    ]
  }
  ];
};

// 向后兼容的默认提供商配置
export const DEFAULT_PROVIDERS: AIProviderMeta[] = getDefaultProviders();

// 根据提供商ID获取元数据
export function getProviderMeta(providerId: AIProvider, locale: 'en' | 'zh' = 'en'): AIProviderMeta | undefined {
  return getDefaultProviders(locale).find(p => p.id === providerId);
}

// 获取所有支持的提供商
export function getAllProviders(locale: 'en' | 'zh' = 'en'): AIProviderMeta[] {
  return getDefaultProviders(locale);
}

// 验证提供商配置
export function validateProviderConfig(provider: AIProviderMeta, config: Record<string, any>, locale: 'en' | 'zh' = 'en'): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!provider.configFields) {
    return { valid: true, errors: [] };
  }
  
  for (const field of provider.configFields) {
    if (field.required && (!config[field.key] || config[field.key].toString().trim() === '')) {
      errors.push(locale === 'zh' ? `${field.label}是必填项` : `${field.label} is required`);
    }
    
    if (field.type === 'url' && config[field.key]) {
      try {
        new URL(config[field.key]);
      } catch {
        errors.push(locale === 'zh' ? `${field.label}必须是有效的URL格式` : `${field.label} must be a valid URL`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
