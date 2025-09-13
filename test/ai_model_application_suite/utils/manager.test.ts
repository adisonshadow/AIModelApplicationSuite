import { AIModelManager, createAIModelManager } from '../../../packages/ai_model_application_suite/src/utils/manager';
import { AIModelConfig, StorageConfig, AIProvider } from '../../../packages/ai_model_application_suite/src/types';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('AIModelManager', () => {
  let manager: AIModelManager;
  let mockConfigs: AIModelConfig[];

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigs = [
      {
        id: 'config-1',
        name: '测试配置1',
        provider: AIProvider.OPENAI,
        enabled: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        config: { apiKey: 'test-key-1' }
      },
      {
        id: 'config-2',
        name: '测试配置2',
        provider: AIProvider.VOLCENGINE,
        enabled: false,
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02'),
        config: { apiKey: 'test-key-2' }
      }
    ];

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockConfigs));
    manager = new AIModelManager();
  });

  describe('初始化', () => {
    it('应该正确初始化管理器', () => {
      expect(manager).toBeInstanceOf(AIModelManager);
    });

    it('应该支持自定义存储配置', () => {
      const customStorage: StorageConfig = {
        type: 'localStorage',
        localStorageKey: 'custom-key'
      };
      
      const customManager = new AIModelManager(customStorage);
      expect(customManager).toBeInstanceOf(AIModelManager);
    });
  });

  describe('配置管理', () => {
    it('应该正确加载配置', async () => {
      const configs = await manager.loadConfigs();
      
      expect(configs).toHaveLength(2);
      expect(configs[0].name).toBe('测试配置1');
      expect(configs[1].name).toBe('测试配置2');
    });

    it('应该正确获取所有配置', () => {
      const configs = manager.getConfigs();
      
      expect(configs).toHaveLength(2);
      expect(configs[0].name).toBe('测试配置1');
    });

    it('应该根据ID获取配置', () => {
      const config = manager.getConfigById('config-1');
      
      expect(config).toBeDefined();
      expect(config!.name).toBe('测试配置1');
    });

    it('应该在没有找到配置时返回null', () => {
      const config = manager.getConfigById('non-existent');
      
      expect(config).toBeNull();
    });

    it('应该正确保存新配置', async () => {
      const newConfig: AIModelConfig = {
        id: 'config-3',
        name: '新配置',
        provider: AIProvider.OPENAI,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: { apiKey: 'new-key' }
      };

      const savedConfig = await manager.saveConfig(newConfig);
      
      expect(savedConfig.name).toBe('新配置');
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('应该正确更新配置', async () => {
      const updatedConfig = await manager.updateConfig('config-1', {
        name: '更新后的配置',
        enabled: false
      });
      
      expect(updatedConfig.name).toBe('更新后的配置');
      expect(updatedConfig.enabled).toBe(false);
    });

    it('应该正确删除配置', async () => {
      await manager.deleteConfig('config-1');
      
      const configs = manager.getConfigs();
      expect(configs).toHaveLength(1);
      expect(configs[0].id).toBe('config-2');
    });
  });

  describe('选中模型管理', () => {
    it('应该正确设置选中的模型', async () => {
      await manager.setSelectedModel('config-1');
      
      expect(manager.getSelectedModelId()).toBe('config-1');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'ai-model-configs-selected',
        'config-1'
      );
    });

    it('应该正确获取选中的模型', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'ai-model-configs-selected') {
          return 'config-1';
        }
        return JSON.stringify(mockConfigs);
      });

      const manager = new AIModelManager();
      await manager.loadConfigs();
      
      const selectedModel = manager.getSelectedModel();
      expect(selectedModel).toBeDefined();
      expect(selectedModel!.name).toBe('测试配置1');
    });

    it('应该正确清除选中的模型', async () => {
      await manager.setSelectedModel(null);
      
      expect(manager.getSelectedModelId()).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'ai-model-configs-selected'
      );
    });

    it('应该在删除选中的模型时清除选中状态', async () => {
      await manager.setSelectedModel('config-1');
      await manager.deleteConfig('config-1');
      
      expect(manager.getSelectedModelId()).toBeNull();
    });
  });

  describe('回调管理', () => {
    it('应该正确注册和触发配置变化回调', async () => {
      const callback = jest.fn();
      const unsubscribe = manager.onConfigsChange(callback);
      
      await manager.loadConfigs();
      
      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: '测试配置1' }),
          expect.objectContaining({ name: '测试配置2' })
        ])
      );
      
      unsubscribe();
    });

    it('应该正确注册和触发选择变化回调', async () => {
      const callback = jest.fn();
      const unsubscribe = manager.onChange(callback);
      
      await manager.setSelectedModel('config-1');
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ name: '测试配置1' })
      );
      
      unsubscribe();
    });

    it('应该正确取消订阅回调', async () => {
      const callback = jest.fn();
      const unsubscribe = manager.onConfigsChange(callback);
      
      unsubscribe();
      await manager.loadConfigs();
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('初始化管理', () => {
    it('应该正确初始化管理器', async () => {
      const callback = jest.fn();
      manager.onConfigsChange(callback);
      
      await manager.initialize();
      
      expect(callback).toHaveBeenCalled();
    });

    it('应该避免重复初始化', async () => {
      const callback = jest.fn();
      manager.onConfigsChange(callback);
      
      await manager.initialize();
      await manager.initialize();
      
      // 回调应该只被调用一次（初始化时）
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('销毁管理', () => {
    it('应该正确销毁管理器', () => {
      const callback = jest.fn();
      manager.onConfigsChange(callback);
      manager.onChange(callback);
      
      manager.destroy();
      
      // 销毁后回调应该被清空
      expect(manager['onConfigsChangeCallbacks']).toHaveLength(0);
      expect(manager['onChangeCallbacks']).toHaveLength(0);
    });
  });

  describe('createAIModelManager', () => {
    it('应该正确创建管理器实例', () => {
      const manager = createAIModelManager();
      
      expect(manager).toBeInstanceOf(AIModelManager);
    });

    it('应该支持自定义存储配置', () => {
      const customStorage: StorageConfig = {
        type: 'localStorage',
        localStorageKey: 'custom-key'
      };
      
      const manager = createAIModelManager(customStorage);
      
      expect(manager).toBeInstanceOf(AIModelManager);
    });
  });

  describe('错误处理', () => {
    it('应该处理加载配置时的错误', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const configs = await manager.loadConfigs();
      
      expect(configs).toEqual([]);
    });

    it('应该处理保存配置时的错误', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Save error');
      });
      
      const config: AIModelConfig = {
        id: 'error-config',
        name: '错误配置',
        provider: AIProvider.OPENAI,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: { apiKey: 'error-key' }
      };
      
      await expect(manager.saveConfig(config)).rejects.toThrow('Save error');
    });

    it('应该处理删除配置时的错误', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Delete error');
      });
      
      await expect(manager.deleteConfig('config-1')).rejects.toThrow('Delete error');
    });
  });
});
