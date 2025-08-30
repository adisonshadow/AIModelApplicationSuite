import { AIProvider, AIProviderMeta } from '../types';

// 预定义的AI提供商配置
export const DEFAULT_PROVIDERS: AIProviderMeta[] = [
  {
    id: AIProvider.OPENAI,
    name: 'OpenAI',
    description: 'OpenAI GPT models (GPT-4, GPT-3.5, etc.)',
    npmPackage: '@ai-sdk/openai',
    requiresApiKey: true,
    defaultBaseURL: 'https://api.openai.com/v1',
    models: [
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
      'text-davinci-003'
    ],
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: ''
      }
    ]
  },
  {
    id: AIProvider.OPENAILIKE,
    name: '基于OpenAI协议的AI模型',
    description: 'OpenAI GPT models (GPT-4, GPT-3.5, etc.)',
    npmPackage: '@ai-sdk/openai',
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
      }
    ]
  },
  {
    id: AIProvider.DEEPSEEK,
    name: 'DeepSeek',
    description: 'DeepSeek AI models',
    npmPackage: '@ai-sdk/deepseek',
    requiresApiKey: true,
    defaultBaseURL: 'https://api.deepseek.com/v1',
    models: [
      'deepseek-chat',
      'deepseek-coder'
    ],
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'sk-...'
      }
    ]
  },
  {
    id: AIProvider.ANTHROPIC,
    name: 'Anthropic',
    description: 'Anthropic Claude models',
    npmPackage: '@ai-sdk/anthropic',
    requiresApiKey: true,
    defaultBaseURL: 'https://api.anthropic.com',
    models: [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0'
    ],
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'sk-ant-...'
      }
    ]
  },
  {
    id: AIProvider.GOOGLE,
    name: 'Google Gemini',
    description: 'Google Gemini models',
    npmPackage: '@ai-sdk/google',
    requiresApiKey: true,
    defaultBaseURL: 'https://generativelanguage.googleapis.com/v1beta',
    models: [
      'gemini-pro',
      'gemini-pro-vision',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ],
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'AIza...'
      }
    ]
  },
  {
    id: AIProvider.MISTRAL,
    name: 'Mistral AI',
    description: 'Mistral AI models',
    npmPackage: '@ai-sdk/mistral',
    requiresApiKey: true,
    defaultBaseURL: 'https://api.mistral.ai/v1',
    models: [
      'mistral-large-latest',
      'mistral-medium-latest',
      'mistral-small-latest',
      'open-mistral-7b',
      'open-mixtral-8x7b'
    ],
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'sk-...'
      }
    ]
  },
  {
    id: AIProvider.COHERE,
    name: 'Cohere',
    description: 'Cohere AI models',
    npmPackage: '@ai-sdk/cohere',
    requiresApiKey: true,
    defaultBaseURL: 'https://api.cohere.ai/v1',
    models: [
      'command-r-plus',
      'command-r',
      'command',
      'command-nightly'
    ],
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'co_...'
      }
    ]
  },
  {
    id: AIProvider.AZURE,
    name: 'Azure OpenAI',
    description: 'Azure OpenAI Service',
    npmPackage: '@ai-sdk/azure',
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
    npmPackage: 'ollama',
    requiresApiKey: false,
    defaultBaseURL: 'http://localhost:11434',
    models: [
      'llama2',
      'codellama',
      'mistral',
      'phi',
      'gemma'
    ],
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
    name: 'Volcengine火山引擎',
    description: 'Volcengine AI models (OpenAI compatible)',
    npmPackage: '@ai-sdk/openai',
    requiresApiKey: true,
    defaultBaseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
      'gpt-4-turbo',
      'gpt-4-turbo-preview'
    ],
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
        label: 'AI模型',
        type: 'autocomplete',
        required: true,
        placeholder: '输入或选择AI模型，如：gpt-4',
        suggestions: [
          'gpt-4',
          'gpt-3.5-turbo',
          'gpt-3.5-turbo-16k',
          'gpt-4-turbo',
          'gpt-4-turbo-preview'
        ]
      }
    ]
  }
];

// 根据提供商ID获取元数据
export function getProviderMeta(providerId: AIProvider): AIProviderMeta | undefined {
  return DEFAULT_PROVIDERS.find(p => p.id === providerId);
}

// 获取所有支持的提供商
export function getAllProviders(): AIProviderMeta[] {
  return DEFAULT_PROVIDERS;
}

// 验证提供商配置
export function validateProviderConfig(provider: AIProviderMeta, config: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!provider.configFields) {
    return { valid: true, errors: [] };
  }
  
  for (const field of provider.configFields) {
    if (field.required && (!config[field.key] || config[field.key].toString().trim() === '')) {
      errors.push(`${field.label}是必填项`);
    }
    
    if (field.type === 'url' && config[field.key]) {
      try {
        new URL(config[field.key]);
      } catch {
        errors.push(`${field.label}必须是有效的URL格式`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}