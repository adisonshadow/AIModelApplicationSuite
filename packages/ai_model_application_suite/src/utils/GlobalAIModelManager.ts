import { AIModelConfig, StorageConfig } from '../types';
import { StorageManager } from './storage';

// 事件类型定义
export type AIModelEventType = 
  | 'modelSelected' 
  | 'modelChanged' 
  | 'configAdded' 
  | 'configUpdated' 
  | 'configDeleted' 
  | 'configsLoaded'
  | 'error';

// 事件数据接口
export interface AIModelEventData {
  type: AIModelEventType;
  data?: any;
  error?: Error;
  timestamp: number;
}

// 事件监听器类型
export type AIModelEventListener = (event: AIModelEventData) => void;

// 错误处理回调类型
export type ErrorHandler = (error: Error, context: string) => void;

// 全局AI模型管理器 - 单例模式
export class GlobalAIModelManager {
  private static instance: GlobalAIModelManager | null = null;
  private storageManager: StorageManager;
  private configs: AIModelConfig[] = [];
  private selectedModelId: string | null = null;
  private isInitialized: boolean = false;
  private eventListeners: Map<AIModelEventType, Set<AIModelEventListener>> = new Map();
  private errorHandler?: ErrorHandler;

  private constructor(storage?: StorageConfig) {
    this.storageManager = new StorageManager(storage);
    this.setupEventTypes();
  }

  // 获取单例实例
  public static getInstance(storage?: StorageConfig): GlobalAIModelManager {
    // 如果没有实例，创建新实例
    if (!GlobalAIModelManager.instance) {
      GlobalAIModelManager.instance = new GlobalAIModelManager(storage);
    } else if (storage) {
      // 如果已有实例但传入了不同的存储配置，重置实例
      const currentStorage = GlobalAIModelManager.instance.storageManager.getStorageConfig();
      if (currentStorage.localStorageKey !== storage.localStorageKey || 
          currentStorage.type !== storage.type) {
        console.log('🔄 重置 GlobalAIModelManager 实例，使用新的存储配置:', { 
          currentStorage, 
          newStorage: storage 
        });
        GlobalAIModelManager.instance = new GlobalAIModelManager(storage);
      }
    }
    return GlobalAIModelManager.instance;
  }

  // 重置单例实例（主要用于测试）
  public static resetInstance(): void {
    if (GlobalAIModelManager.instance) {
      GlobalAIModelManager.instance.destroy();
      GlobalAIModelManager.instance = null;
    }
  }

  // 设置事件类型
  private setupEventTypes(): void {
    const eventTypes: AIModelEventType[] = [
      'modelSelected',
      'modelChanged', 
      'configAdded',
      'configUpdated',
      'configDeleted',
      'configsLoaded',
      'error'
    ];
    
    eventTypes.forEach(type => {
      this.eventListeners.set(type, new Set());
    });
  }

  // 设置错误处理器
  public setErrorHandler(handler: ErrorHandler): void {
    this.errorHandler = handler;
  }

  // 获取存储配置
  public getStorageConfig(): StorageConfig {
    return this.storageManager.getStorageConfig();
  }

  // 统一错误处理
  private handleError(error: Error, context: string): void {
    console.error(`[GlobalAIModelManager] ${context}:`, error);
    
    if (this.errorHandler) {
      this.errorHandler(error, context);
    }
    
    this.emitEvent({
      type: 'error',
      error,
      timestamp: Date.now()
    });
  }

  // 初始化管理器
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 加载配置
      await this.loadConfigs();
      
      // 加载选中的模型
      await this.loadSelectedModel();
      
      this.isInitialized = true;
      
      this.emitEvent({
        type: 'configsLoaded',
        data: this.configs,
        timestamp: Date.now()
      });
    } catch (error) {
      this.handleError(error as Error, 'initialize');
      throw error;
    }
  }

  // 加载配置
  private async loadConfigs(): Promise<void> {
    try {
      this.configs = await this.storageManager.loadConfigs();
    } catch (error) {
      this.handleError(error as Error, 'loadConfigs');
      this.configs = [];
    }
  }

  // 加载选中的模型
  private async loadSelectedModel(): Promise<void> {
    try {
      const key = this.storageManager['config'].localStorageKey || 'ai-model-configs';
      const selectedKey = `${key}-selected`;
      const selectedId = localStorage.getItem(selectedKey);
      if (selectedId) {
        this.selectedModelId = selectedId;
      }
    } catch (error) {
      this.handleError(error as Error, 'loadSelectedModel');
    }
  }

  // 保存选中的模型
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
      this.handleError(error as Error, 'saveSelectedModel');
    }
  }

  // 获取当前选中的模型
  public getCurrentModel(): AIModelConfig | null {
    if (!this.selectedModelId) {
      return null;
    }
    return this.configs.find(config => config.id === this.selectedModelId) || null;
  }

  // 获取当前选中的模型ID
  public getCurrentModelId(): string | null {
    return this.selectedModelId;
  }

  // 设置当前模型
  public async setCurrentModel(modelId: string | null): Promise<void> {
    try {
      if (this.selectedModelId === modelId) {
        return;
      }

      await this.saveSelectedModel(modelId);
      const selectedConfig = this.getCurrentModel();
      
      this.emitEvent({
        type: 'modelSelected',
        data: { modelId, config: selectedConfig },
        timestamp: Date.now()
      });

      this.emitEvent({
        type: 'modelChanged',
        data: { modelId, config: selectedConfig },
        timestamp: Date.now()
      });
    } catch (error) {
      this.handleError(error as Error, 'setCurrentModel');
      throw error;
    }
  }

  // 获取所有配置
  public getConfigs(): AIModelConfig[] {
    return [...this.configs];
  }

  // 根据ID获取配置
  public getConfigById(id: string): AIModelConfig | null {
    return this.configs.find(config => config.id === id) || null;
  }

  // 添加配置
  public async addConfig(config: AIModelConfig): Promise<AIModelConfig> {
    try {
      const savedConfig = await this.storageManager.saveConfig(config);
      await this.loadConfigs();
      
      this.emitEvent({
        type: 'configAdded',
        data: savedConfig,
        timestamp: Date.now()
      });
      
      return savedConfig;
    } catch (error) {
      this.handleError(error as Error, 'addConfig');
      throw error;
    }
  }

  // 更新配置
  public async updateConfig(id: string, updates: Partial<AIModelConfig>): Promise<AIModelConfig> {
    try {
      const updatedConfig = await this.storageManager.updateConfig(id, updates);
      await this.loadConfigs();
      
      this.emitEvent({
        type: 'configUpdated',
        data: updatedConfig,
        timestamp: Date.now()
      });
      
      return updatedConfig;
    } catch (error) {
      this.handleError(error as Error, 'updateConfig');
      throw error;
    }
  }

  // 删除配置
  public async deleteConfig(id: string): Promise<void> {
    try {
      await this.storageManager.deleteConfig(id);
      await this.loadConfigs();
      
      // 如果删除的是当前选中的模型，清除选中状态
      if (this.selectedModelId === id) {
        await this.setCurrentModel(null);
      }
      
      this.emitEvent({
        type: 'configDeleted',
        data: { id },
        timestamp: Date.now()
      });
    } catch (error) {
      this.handleError(error as Error, 'deleteConfig');
      throw error;
    }
  }

  // 订阅事件
  public subscribe(eventType: AIModelEventType, listener: AIModelEventListener): () => void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.add(listener);
      
      // 返回取消订阅的函数
      return () => {
        listeners.delete(listener);
      };
    }
    
    return () => {};
  }

  // 取消订阅
  public unsubscribe(eventType: AIModelEventType, listener: AIModelEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // 发送事件
  private emitEvent(event: AIModelEventData): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`[GlobalAIModelManager] Error in event listener for ${event.type}:`, error);
        }
      });
    }
  }

  // 销毁管理器
  public destroy(): void {
    this.eventListeners.forEach(listeners => listeners.clear());
    this.eventListeners.clear();
    this.configs = [];
    this.selectedModelId = null;
    this.isInitialized = false;
    this.errorHandler = undefined;
  }

  // 检查是否已初始化
  public isReady(): boolean {
    return this.isInitialized;
  }

  // 获取管理器状态
  public getStatus(): {
    isInitialized: boolean;
    configsCount: number;
    selectedModelId: string | null;
    hasErrorHandler: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      configsCount: this.configs.length,
      selectedModelId: this.selectedModelId,
      hasErrorHandler: !!this.errorHandler
    };
  }
}

// 导出便捷的获取实例函数
export const getGlobalAIModelManager = (storage?: StorageConfig): GlobalAIModelManager => {
  return GlobalAIModelManager.getInstance(storage);
};

// 导出默认实例
export const globalAIModelManager = GlobalAIModelManager.getInstance();
