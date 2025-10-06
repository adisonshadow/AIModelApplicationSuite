import { AIModelConfig } from '../types';
import { OpenAICompatibleSender } from './openai_compatible';

/**
 * 阿里云百炼 AI 模型发送器
 * 继承自 OpenAICompatibleSender，使用 OpenAI 兼容的 API
 */
export class AliyunBailianAISender extends OpenAICompatibleSender {
  constructor(config: AIModelConfig) {
    // 设置阿里云百炼的默认 baseURL
    const updatedConfig = {
      ...config,
      config: {
        apiKey: config.config?.apiKey || '',
        baseURL: config.config?.baseURL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: config.config?.model,
        jsonParams: config.config?.jsonParams
      }
    };
    
    super(updatedConfig);
  }
}

// 导出为默认
export default AliyunBailianAISender;

