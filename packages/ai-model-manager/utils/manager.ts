import { AIModelConfig, StorageConfig } from '../types';
import { StorageManager } from './storage';

// AI模型管理器类
export class AIModelManager {
  private storageManager: StorageManager;
  private configs: AIModelConfig[] = [];
  private selectedModelId: string | null = null;
  private onChangeCallbacks: ((config: AIModelConfig | null) => void)[] = [];
  private onConfigsChangeCallbacks: ((configs: AIModelConfig[]) => void)[] = [];
  private isInitialized: boolean = false;

  constructor(storage?: StorageConfig) {
    this.storageManager = new StorageManager(storage);
    this.loadSelectedModel();
  }

  // 加载选中的模型ID
  private async loadSelectedModel(): Promise<void> {
    try {
      const key = this.storageManager['config'].localStorageKey || 'ai-model-configs';
      const selectedKey = `${key}-selected`;
      const selectedId = localStorage.getItem(selectedKey);
      if (selectedId) {
        this.selectedModelId = selectedId;
      }
    } catch (error) {
      console.error('Failed to load selected model:', error);
    }
  }

  // 保存选中的模型ID
  private async saveSelectedModel(modelId: string | null): Promise<void> {
    try {
      const key = this.storageManager['config'].localStorageKey || 'ai-model-configs';
      const selectedKey = `${key}-selected`;
      if (modelId) {
        localStorage.setItem(selectedKey, modelId);
      } else {
        localStorage.removeItem(selectedKey);
      }
      this.selectedModelId = modelId;
    } catch (error) {
      console.error('Failed to save selected model:', error);
    }
  }

  // 加载所有配置
  async loadConfigs(): Promise<AIModelConfig[]> {
    try {
      const newConfigs = await this.storageManager.loadConfigs();
      
      // 检查配置是否真的发生了变化
      const hasChanged = this.configs.length !== newConfigs.length || 
        this.configs.some((config, index) => config.id !== newConfigs[index]?.id);
      
      this.configs = newConfigs;
      
      // 只有在配置真正发生变化时才通知
      if (hasChanged) {
        this.notifyConfigsChange();
      }
      
      return this.configs;
    } catch (error) {
      console.error('Failed to load configs:', error);
      return [];
    }
  }

  // 获取当前选中的模型配置
  getSelectedModel(): AIModelConfig | null {
    if (!this.selectedModelId) {
      return null;
    }
    return this.configs.find(config => config.id === this.selectedModelId) || null;
  }

  // 获取当前选中的模型ID
  getSelectedModelId(): string | null {
    return this.selectedModelId;
  }

  // 设置选中的模型
  async setSelectedModel(modelId: string | null): Promise<void> {
    // 检查是否真的发生了变化
    if (this.selectedModelId === modelId) {
      return;
    }
    
    await this.saveSelectedModel(modelId);
    const selectedConfig = this.getSelectedModel();
    this.notifyChange(selectedConfig);
  }

  // 获取所有配置
  getConfigs(): AIModelConfig[] {
    return [...this.configs];
  }

  // 根据ID获取配置
  getConfigById(id: string): AIModelConfig | null {
    return this.configs.find(config => config.id === id) || null;
  }

  // 保存配置
  async saveConfig(config: AIModelConfig): Promise<AIModelConfig> {
    const savedConfig = await this.storageManager.saveConfig(config);
    await this.loadConfigs();
    return savedConfig;
  }

  // 删除配置
  async deleteConfig(id: string): Promise<void> {
    await this.storageManager.deleteConfig(id);
    await this.loadConfigs();
    
    // 如果删除的是当前选中的模型，清除选中状态
    if (this.selectedModelId === id) {
      await this.setSelectedModel(null);
    }
  }

  // 更新配置
  async updateConfig(id: string, updates: Partial<AIModelConfig>): Promise<AIModelConfig> {
    const updatedConfig = await this.storageManager.updateConfig(id, updates);
    await this.loadConfigs();
    return updatedConfig;
  }

  // 添加选择变化回调
  onChange(callback: (config: AIModelConfig | null) => void): () => void {
    this.onChangeCallbacks.push(callback);
    
    // 返回取消订阅的函数
    return () => {
      const index = this.onChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.onChangeCallbacks.splice(index, 1);
      }
    };
  }

  // 添加配置列表变化回调
  onConfigsChange(callback: (configs: AIModelConfig[]) => void): () => void {
    this.onConfigsChangeCallbacks.push(callback);
    
    // 返回取消订阅的函数
    return () => {
      const index = this.onConfigsChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.onConfigsChangeCallbacks.splice(index, 1);
      }
    };
  }

  // 通知选择变化
  private notifyChange(config: AIModelConfig | null): void {
    this.onChangeCallbacks.forEach(callback => {
      try {
        callback(config);
      } catch (error) {
        console.error('Error in onChange callback:', error);
      }
    });
  }

  // 通知配置列表变化
  private notifyConfigsChange(): void {
    this.onConfigsChangeCallbacks.forEach(callback => {
      try {
        callback([...this.configs]);
      } catch (error) {
        console.error('Error in onConfigsChange callback:', error);
      }
    });
  }

  // 初始化管理器（加载配置和选中状态）
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return; // 避免重复初始化
    }
    
    // 先加载配置，但不通知变化（因为组件可能还没有注册监听器）
    await this.storageManager.loadConfigs().then(configs => {
      this.configs = configs;
    });
    
    await this.loadSelectedModel();
    
    // 手动触发一次配置变化通知，确保组件能收到初始配置
    this.notifyConfigsChange();
    
    // 如果有选中的模型，通知回调
    const selectedConfig = this.getSelectedModel();
    if (selectedConfig) {
      this.notifyChange(selectedConfig);
    }
    
    this.isInitialized = true;
  }

  // 销毁管理器（清理回调）
  destroy(): void {
    this.onChangeCallbacks = [];
    this.onConfigsChangeCallbacks = [];
  }
}

// 创建默认的管理器实例
export function createAIModelManager(storage?: StorageConfig): AIModelManager {
  return new AIModelManager(storage);
}
