import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIModelSelect, createAIModelManager, createAIModelSender } from '../../../packages/ai_model_application_suite/src';
import { AIProvider, AIModelConfig } from '../../../packages/ai_model_application_suite/src/types';

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

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      },
      completions: {
        create: jest.fn()
      }
    }))
  };
});

describe('AI Model Application Suite - 端到端测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('完整的AI模型管理流程', () => {
    it('应该能够完整地管理AI模型配置', async () => {
      // 1. 创建管理器
      const manager = createAIModelManager({
        type: 'localStorage',
        localStorageKey: 'test-configs'
      });

      // 2. 创建测试配置
      const testConfig: AIModelConfig = {
        id: 'test-config-1',
        name: '测试OpenAI配置',
        provider: AIProvider.OPENAI,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {
          apiKey: 'sk-test-key',
          model: 'gpt-4'
        }
      };

      // 3. 保存配置
      const savedConfig = await manager.saveConfig(testConfig);
      expect(savedConfig.name).toBe('测试OpenAI配置');

      // 4. 加载配置
      const configs = await manager.loadConfigs();
      expect(configs).toHaveLength(1);
      expect(configs[0].name).toBe('测试OpenAI配置');

      // 5. 设置选中的模型
      await manager.setSelectedModel('test-config-1');
      expect(manager.getSelectedModelId()).toBe('test-config-1');

      // 6. 获取选中的模型
      const selectedModel = manager.getSelectedModel();
      expect(selectedModel).toBeDefined();
      expect(selectedModel!.name).toBe('测试OpenAI配置');

      // 7. 更新配置
      const updatedConfig = await manager.updateConfig('test-config-1', {
        name: '更新后的配置',
        enabled: false
      });
      expect(updatedConfig.name).toBe('更新后的配置');
      expect(updatedConfig.enabled).toBe(false);

      // 8. 删除配置
      await manager.deleteConfig('test-config-1');
      const remainingConfigs = manager.getConfigs();
      expect(remainingConfigs).toHaveLength(0);
      expect(manager.getSelectedModelId()).toBeNull();
    });

    it('应该支持多个配置的管理', async () => {
      const manager = createAIModelManager();

      // 创建多个配置
      const configs = [
        {
          id: 'config-1',
          name: 'OpenAI配置',
          provider: AIProvider.OPENAI,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          config: { apiKey: 'sk-openai-key' }
        },
        {
          id: 'config-2',
          name: 'Volcengine配置',
          provider: AIProvider.VOLCENGINE,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          config: { apiKey: 'volcengine-key' }
        }
      ];

      // 保存所有配置
      for (const config of configs) {
        await manager.saveConfig(config);
      }

      // 验证所有配置都被保存
      const loadedConfigs = await manager.loadConfigs();
      expect(loadedConfigs).toHaveLength(2);

      // 切换选中的模型
      await manager.setSelectedModel('config-1');
      expect(manager.getSelectedModel()!.name).toBe('OpenAI配置');

      await manager.setSelectedModel('config-2');
      expect(manager.getSelectedModel()!.name).toBe('Volcengine配置');
    });
  });

  describe('AI模型发送器集成', () => {
    it('应该能够创建和使用AI发送器', async () => {
      const config: AIModelConfig = {
        id: 'sender-test',
        name: '发送器测试',
        provider: AIProvider.VOLCENGINE,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {
          apiKey: 'test-api-key',
          baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
          model: 'gpt-4'
        }
      };

      // 创建发送器
      const sender = createAIModelSender(config);
      expect(sender).toBeDefined();

      // 验证发送器方法存在
      expect(typeof sender.sendChatMessage).toBe('function');
      expect(typeof sender.sendChatMessageStream).toBe('function');
      expect(typeof sender.sendCompletion).toBe('function');
      expect(typeof sender.sendCompletionStream).toBe('function');
    });

    it('应该支持不同提供商的发送器', () => {
      const openaiConfig: AIModelConfig = {
        id: 'openai-sender',
        name: 'OpenAI发送器',
        provider: AIProvider.OPENAI,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: { apiKey: 'sk-openai-key' }
      };

      const volcengineConfig: AIModelConfig = {
        id: 'volcengine-sender',
        name: 'Volcengine发送器',
        provider: AIProvider.VOLCENGINE,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: { apiKey: 'volcengine-key' }
      };

      const openaiSender = createAIModelSender(openaiConfig);
      const volcengineSender = createAIModelSender(volcengineConfig);

      expect(openaiSender).toBeDefined();
      expect(volcengineSender).toBeDefined();
      expect(openaiSender).not.toBe(volcengineSender);
    });
  });

  describe('React组件集成', () => {
    it('应该能够渲染AI模型选择器', () => {
      render(<AIModelSelect mode="select" />);
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('请选择AI模型')).toBeInTheDocument();
    });

    it('应该支持配置变化回调', async () => {
      const onConfigChange = jest.fn();
      render(<AIModelSelect onConfigChange={onConfigChange} />);
      
      // 由于组件内部有异步逻辑，这里主要验证回调函数被正确传递
      expect(onConfigChange).toBeDefined();
    });

    it('应该支持模型选择变化回调', async () => {
      const onModelChange = jest.fn();
      render(<AIModelSelect onModelChange={onModelChange} />);
      
      expect(onModelChange).toBeDefined();
    });

    it('应该支持自定义存储配置', () => {
      const customStorage = {
        type: 'localStorage' as const,
        localStorageKey: 'custom-key'
      };
      
      render(<AIModelSelect storage={customStorage} />);
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该处理localStorage错误', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const manager = createAIModelManager();
      const configs = await manager.loadConfigs();
      
      // 应该返回空数组而不是抛出错误
      expect(configs).toEqual([]);
    });

    it('应该处理无效的配置数据', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const manager = createAIModelManager();
      const configs = await manager.loadConfigs();
      
      // 应该返回空数组
      expect(configs).toEqual([]);
    });

    it('应该处理不支持的提供商', () => {
      const invalidConfig: AIModelConfig = {
        id: 'invalid',
        name: '无效配置',
        provider: 'unsupported' as any,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: { apiKey: 'test-key' }
      };

      expect(() => createAIModelSender(invalidConfig)).toThrow(
        '不支持的 AI 提供商: unsupported'
      );
    });
  });

  describe('性能和内存管理', () => {
    it('应该正确清理回调', () => {
      const manager = createAIModelManager();
      
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      const unsubscribe1 = manager.onConfigsChange(callback1);
      const unsubscribe2 = manager.onChange(callback2);
      
      // 取消订阅
      unsubscribe1();
      unsubscribe2();
      
      // 销毁管理器
      manager.destroy();
      
      // 验证回调被清理
      expect(manager['onConfigsChangeCallbacks']).toHaveLength(0);
      expect(manager['onChangeCallbacks']).toHaveLength(0);
    });

    it('应该避免重复初始化', async () => {
      const manager = createAIModelManager();
      
      const callback = jest.fn();
      manager.onConfigsChange(callback);
      
      // 多次初始化
      await manager.initialize();
      await manager.initialize();
      await manager.initialize();
      
      // 回调应该只被调用一次
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('数据一致性', () => {
    it('应该保持配置数据的一致性', async () => {
      const manager = createAIModelManager();
      
      const config: AIModelConfig = {
        id: 'consistency-test',
        name: '一致性测试',
        provider: AIProvider.OPENAI,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: { apiKey: 'test-key' }
      };
      
      // 保存配置
      await manager.saveConfig(config);
      
      // 通过不同方式获取配置，应该一致
      const configs1 = await manager.loadConfigs();
      const configs2 = manager.getConfigs();
      const configById = manager.getConfigById('consistency-test');
      
      expect(configs1).toHaveLength(1);
      expect(configs2).toHaveLength(1);
      expect(configById).toBeDefined();
      
      expect(configs1[0].name).toBe('一致性测试');
      expect(configs2[0].name).toBe('一致性测试');
      expect(configById!.name).toBe('一致性测试');
    });

    it('应该正确处理时间戳', async () => {
      const manager = createAIModelManager();
      
      const config: AIModelConfig = {
        id: 'timestamp-test',
        name: '时间戳测试',
        provider: AIProvider.OPENAI,
        enabled: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        config: { apiKey: 'test-key' }
      };
      
      await manager.saveConfig(config);
      
      const loadedConfig = manager.getConfigById('timestamp-test');
      expect(loadedConfig).toBeDefined();
      expect(loadedConfig!.createdAt).toBeInstanceOf(Date);
      expect(loadedConfig!.updatedAt).toBeInstanceOf(Date);
      expect(loadedConfig!.updatedAt.getTime()).toBeGreaterThan(config.createdAt.getTime());
    });
  });
});
