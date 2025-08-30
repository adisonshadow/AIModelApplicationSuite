import { AIModelConfig, StorageConfig } from '../types';

// 默认的localStorage key
const DEFAULT_STORAGE_KEY = 'ai-model-configs';

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 存储管理器类
export class StorageManager {
  private config: StorageConfig;

  constructor(config?: StorageConfig) {
    this.config = config || {
      type: 'localStorage',
      localStorageKey: DEFAULT_STORAGE_KEY
    };
  }

  // 加载配置列表
  async loadConfigs(): Promise<AIModelConfig[]> {
    try {
      switch (this.config.type) {
        case 'localStorage':
          return this.loadFromLocalStorage();
        case 'api':
          return await this.loadFromAPI();
        case 'custom':
          return await this.loadFromCustom();
        default:
          throw new Error(`Unsupported storage type: ${this.config.type}`);
      }
    } catch (error) {
      console.error('Failed to load configs:', error);
      return [];
    }
  }

  // 保存配置
  async saveConfig(config: AIModelConfig): Promise<AIModelConfig> {
    const updatedConfig = {
      ...config,
      id: config.id || generateId(),
      updatedAt: new Date()
    };

    try {
      switch (this.config.type) {
        case 'localStorage':
          return this.saveToLocalStorage(updatedConfig);
        case 'api':
          return await this.saveToAPI(updatedConfig);
        case 'custom':
          return await this.saveToCustom(updatedConfig);
        default:
          throw new Error(`Unsupported storage type: ${this.config.type}`);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  // 删除配置
  async deleteConfig(id: string): Promise<void> {
    try {
      switch (this.config.type) {
        case 'localStorage':
          return this.deleteFromLocalStorage(id);
        case 'api':
          return await this.deleteFromAPI(id);
        case 'custom':
          return await this.deleteFromCustom(id);
        default:
          throw new Error(`Unsupported storage type: ${this.config.type}`);
      }
    } catch (error) {
      console.error('Failed to delete config:', error);
      throw error;
    }
  }

  // 更新配置
  async updateConfig(id: string, updates: Partial<AIModelConfig>): Promise<AIModelConfig> {
    const configs = await this.loadConfigs();
    const existingConfig = configs.find(c => c.id === id);
    
    if (!existingConfig) {
      throw new Error(`Config with id ${id} not found`);
    }

    const updatedConfig = {
      ...existingConfig,
      ...updates,
      id,
      updatedAt: new Date()
    };

    return await this.saveConfig(updatedConfig);
  }

  // localStorage 相关方法
  private loadFromLocalStorage(): AIModelConfig[] {
    try {
      const key = this.config.localStorageKey || DEFAULT_STORAGE_KEY;
      const data = localStorage.getItem(key);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.map(this.deserializeConfig) : [];
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return [];
    }
  }

  private saveToLocalStorage(config: AIModelConfig): AIModelConfig {
    const key = this.config.localStorageKey || DEFAULT_STORAGE_KEY;
    const configs = this.loadFromLocalStorage();
    const existingIndex = configs.findIndex(c => c.id === config.id);
    
    if (existingIndex >= 0) {
      configs[existingIndex] = config;
    } else {
      configs.push(config);
    }
    
    localStorage.setItem(key, JSON.stringify(configs.map(this.serializeConfig)));
    return config;
  }

  private deleteFromLocalStorage(id: string): void {
    const key = this.config.localStorageKey || DEFAULT_STORAGE_KEY;
    const configs = this.loadFromLocalStorage();
    const filteredConfigs = configs.filter(c => c.id !== id);
    localStorage.setItem(key, JSON.stringify(filteredConfigs.map(this.serializeConfig)));
  }

  // API 相关方法
  private async loadFromAPI(): Promise<AIModelConfig[]> {
    if (!this.config.api?.getConfigs) {
      throw new Error('API getConfigs method not configured');
    }
    
    const configs = await this.config.api.getConfigs();
    return configs.map(this.deserializeConfig);
  }

  private async saveToAPI(config: AIModelConfig): Promise<AIModelConfig> {
    if (!this.config.api?.saveConfig) {
      throw new Error('API saveConfig method not configured');
    }
    
    const savedConfig = await this.config.api.saveConfig(config);
    return this.deserializeConfig(savedConfig);
  }

  private async deleteFromAPI(id: string): Promise<void> {
    if (!this.config.api?.deleteConfig) {
      throw new Error('API deleteConfig method not configured');
    }
    
    await this.config.api.deleteConfig(id);
  }

  // Custom 相关方法
  private async loadFromCustom(): Promise<AIModelConfig[]> {
    if (!this.config.custom?.load) {
      throw new Error('Custom load method not configured');
    }
    
    const configs = await this.config.custom.load();
    return Array.isArray(configs) ? configs.map(this.deserializeConfig) : [];
  }

  private async saveToCustom(config: AIModelConfig): Promise<AIModelConfig> {
    const configs = await this.loadFromCustom();
    const existingIndex = configs.findIndex(c => c.id === config.id);
    
    if (existingIndex >= 0) {
      configs[existingIndex] = config;
    } else {
      configs.push(config);
    }
    
    if (this.config.custom?.save) {
      await this.config.custom.save(configs);
    }
    
    return config;
  }

  private async deleteFromCustom(id: string): Promise<void> {
    const configs = await this.loadFromCustom();
    const filteredConfigs = configs.filter(c => c.id !== id);
    
    if (this.config.custom?.save) {
      await this.config.custom.save(filteredConfigs);
    }
  }

  // 序列化/反序列化方法
  private serializeConfig(config: AIModelConfig): any {
    return {
      ...config,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString()
    };
  }

  private deserializeConfig(data: any): AIModelConfig {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  }
}

// 创建默认的存储管理器实例
export function createStorageManager(config?: StorageConfig): StorageManager {
  return new StorageManager(config);
}