import { StorageManager, generateId } from '../../../packages/ai_model_application_suite/src/utils/storage';
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

describe('StorageManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateId', () => {
    it('应该生成唯一的ID', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });
  });

  describe('localStorage存储', () => {
    it('应该正确加载配置', async () => {
      const mockConfigs = [
        {
          id: 'test-1',
          name: '测试配置1',
          provider: AIProvider.OPENAI,
          enabled: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          config: { apiKey: 'test-key' }
        }
      ];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockConfigs));
      
      const storageManager = new StorageManager();
      const configs = await storageManager.loadConfigs();
      
      expect(configs).toHaveLength(1);
      expect(configs[0].name).toBe('测试配置1');
      expect(configs[0].createdAt).toBeInstanceOf(Date);
      expect(configs[0].updatedAt).toBeInstanceOf(Date);
    });

    it('应该处理空的localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const storageManager = new StorageManager();
      const configs = await storageManager.loadConfigs();
      
      expect(configs).toEqual([]);
    });

    it('应该正确保存配置', async () => {
      mockLocalStorage.getItem.mockReturnValue('[]');
      
      const storageManager = new StorageManager();
      const config: AIModelConfig = {
        id: 'test-1',
        name: '测试配置',
        provider: AIProvider.OPENAI,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: { apiKey: 'test-key' }
      };
      
      const savedConfig = await storageManager.saveConfig(config);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      expect(savedConfig.id).toBe('test-1');
      expect(savedConfig.name).toBe('测试配置');
    });

    it('应该正确更新现有配置', async () => {
      const existingConfigs = [
        {
          id: 'test-1',
          name: '原始配置',
          provider: AIProvider.OPENAI,
          enabled: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          config: { apiKey: 'test-key' }
        }
      ];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingConfigs));
      
      const storageManager = new StorageManager();
      const updatedConfig: AIModelConfig = {
        id: 'test-1',
        name: '更新后的配置',
        provider: AIProvider.OPENAI,
        enabled: true,
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date(),
        config: { apiKey: 'test-key' }
      };
      
      const savedConfig = await storageManager.saveConfig(updatedConfig);
      
      expect(savedConfig.name).toBe('更新后的配置');
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('应该正确删除配置', async () => {
      const existingConfigs = [
        {
          id: 'test-1',
          name: '测试配置',
          provider: AIProvider.OPENAI,
          enabled: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          config: { apiKey: 'test-key' }
        }
      ];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingConfigs));
      
      const storageManager = new StorageManager();
      await storageManager.deleteConfig('test-1');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'ai-model-configs',
        '[]'
      );
    });

    it('应该正确更新配置', async () => {
      const existingConfigs = [
        {
          id: 'test-1',
          name: '原始配置',
          provider: AIProvider.OPENAI,
          enabled: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          config: { apiKey: 'test-key' }
        }
      ];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingConfigs));
      
      const storageManager = new StorageManager();
      const updatedConfig = await storageManager.updateConfig('test-1', {
        name: '更新后的配置',
        enabled: false
      });
      
      expect(updatedConfig.name).toBe('更新后的配置');
      expect(updatedConfig.enabled).toBe(false);
      expect(updatedConfig.id).toBe('test-1');
    });

    it('应该在更新不存在的配置时抛出错误', async () => {
      mockLocalStorage.getItem.mockReturnValue('[]');
      
      const storageManager = new StorageManager();
      
      await expect(
        storageManager.updateConfig('non-existent', { name: '新名称' })
      ).rejects.toThrow('Config with id non-existent not found');
    });
  });

  describe('API存储', () => {
    const apiConfig: StorageConfig = {
      type: 'api',
      api: {
        getConfigs: jest.fn(),
        saveConfig: jest.fn(),
        deleteConfig: jest.fn(),
        updateConfig: jest.fn()
      }
    };

    it('应该正确加载API配置', async () => {
      const mockConfigs = [
        {
          id: 'api-1',
          name: 'API配置',
          provider: AIProvider.OPENAI,
          enabled: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          config: { apiKey: 'api-key' }
        }
      ];
      
      (apiConfig.api!.getConfigs as jest.Mock).mockResolvedValue(mockConfigs);
      
      const storageManager = new StorageManager(apiConfig);
      const configs = await storageManager.loadConfigs();
      
      expect(configs).toHaveLength(1);
      expect(configs[0].name).toBe('API配置');
      expect(apiConfig.api!.getConfigs).toHaveBeenCalled();
    });

    it('应该正确保存API配置', async () => {
      const config: AIModelConfig = {
        id: 'api-1',
        name: 'API配置',
        provider: AIProvider.OPENAI,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: { apiKey: 'api-key' }
      };
      
      (apiConfig.api!.saveConfig as jest.Mock).mockResolvedValue(config);
      
      const storageManager = new StorageManager(apiConfig);
      const savedConfig = await storageManager.saveConfig(config);
      
      expect(savedConfig).toEqual(config);
      expect(apiConfig.api!.saveConfig).toHaveBeenCalledWith(config);
    });

    it('应该正确删除API配置', async () => {
      (apiConfig.api!.deleteConfig as jest.Mock).mockResolvedValue(undefined);
      
      const storageManager = new StorageManager(apiConfig);
      await storageManager.deleteConfig('api-1');
      
      expect(apiConfig.api!.deleteConfig).toHaveBeenCalledWith('api-1');
    });
  });

  describe('自定义存储', () => {
    const customConfig: StorageConfig = {
      type: 'custom',
      custom: {
        load: jest.fn(),
        save: jest.fn()
      }
    };

    it('应该正确加载自定义配置', async () => {
      const mockConfigs = [
        {
          id: 'custom-1',
          name: '自定义配置',
          provider: AIProvider.OPENAI,
          enabled: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          config: { apiKey: 'custom-key' }
        }
      ];
      
      (customConfig.custom!.load as jest.Mock).mockReturnValue(mockConfigs);
      
      const storageManager = new StorageManager(customConfig);
      const configs = await storageManager.loadConfigs();
      
      expect(configs).toHaveLength(1);
      expect(configs[0].name).toBe('自定义配置');
      expect(customConfig.custom!.load).toHaveBeenCalled();
    });

    it('应该正确保存自定义配置', async () => {
      const config: AIModelConfig = {
        id: 'custom-1',
        name: '自定义配置',
        provider: AIProvider.OPENAI,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: { apiKey: 'custom-key' }
      };
      
      (customConfig.custom!.load as jest.Mock).mockReturnValue([]);
      (customConfig.custom!.save as jest.Mock).mockResolvedValue(undefined);
      
      const storageManager = new StorageManager(customConfig);
      const savedConfig = await storageManager.saveConfig(config);
      
      expect(savedConfig).toEqual(config);
      expect(customConfig.custom!.save).toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('应该处理localStorage解析错误', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      
      const storageManager = new StorageManager();
      const configs = await storageManager.loadConfigs();
      
      expect(configs).toEqual([]);
    });

    it('应该处理不支持的存储类型', async () => {
      const invalidConfig = { type: 'invalid' } as any;
      
      const storageManager = new StorageManager(invalidConfig);
      
      await expect(storageManager.loadConfigs()).rejects.toThrow(
        'Unsupported storage type: invalid'
      );
    });

    it('应该处理API配置缺失', async () => {
      const invalidApiConfig: StorageConfig = {
        type: 'api',
        api: {} as any
      };
      
      const storageManager = new StorageManager(invalidApiConfig);
      
      await expect(storageManager.loadConfigs()).rejects.toThrow(
        'API getConfigs method not configured'
      );
    });
  });
});
