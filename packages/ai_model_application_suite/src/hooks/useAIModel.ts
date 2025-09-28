import { useState, useEffect, useCallback, useRef } from 'react';
import { AIModelConfig, StorageConfig } from '../types';
import { GlobalAIModelManager, AIModelEventType, AIModelEventData } from '../utils/GlobalAIModelManager';

// Hook返回类型
export interface UseAIModelReturn {
  // 当前选中的模型
  currentModel: AIModelConfig | null;
  // 当前选中的模型ID
  currentModelId: string | null;
  // 所有配置
  configs: AIModelConfig[];
  // 加载状态
  loading: boolean;
  // 错误信息
  error: string | null;
  // 是否已初始化
  isReady: boolean;
  // 设置当前模型
  setCurrentModel: (modelId: string | null) => Promise<void>;
  // 添加配置
  addConfig: (config: AIModelConfig) => Promise<AIModelConfig>;
  // 更新配置
  updateConfig: (id: string, updates: Partial<AIModelConfig>) => Promise<AIModelConfig>;
  // 删除配置
  deleteConfig: (id: string) => Promise<void>;
  // 根据ID获取配置
  getConfigById: (id: string) => AIModelConfig | null;
  // 订阅事件
  subscribe: (eventType: AIModelEventType, listener: (event: AIModelEventData) => void) => () => void;
  // 设置错误处理器
  setErrorHandler: (handler: (error: Error, context: string) => void) => void;
}

// 主要的AI模型Hook
export function useAIModel(storage?: StorageConfig): UseAIModelReturn {
  const [currentModel, setCurrentModelState] = useState<AIModelConfig | null>(null);
  const [currentModelId, setCurrentModelIdState] = useState<string | null>(null);
  const [configs, setConfigs] = useState<AIModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  const managerRef = useRef<GlobalAIModelManager | null>(null);
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // 初始化管理器
  useEffect(() => {
    const manager = GlobalAIModelManager.getInstance(storage);
    managerRef.current = manager;

    // 设置错误处理器
    manager.setErrorHandler((error, context) => {
      setError(`${context}: ${error.message}`);
    });

    // 初始化
    manager.initialize().then(() => {
      setIsReady(true);
      setLoading(false);
      
      // 获取初始状态
      setCurrentModelState(manager.getCurrentModel());
      setCurrentModelIdState(manager.getCurrentModelId());
      setConfigs(manager.getConfigs());
    }).catch((err) => {
      setError(`初始化失败: ${err.message}`);
      setLoading(false);
    });

    // 订阅事件
    const unsubscribeModelSelected = manager.subscribe('modelSelected', (event) => {
      setCurrentModelState(event.data?.config || null);
      setCurrentModelIdState(event.data?.modelId || null);
    });

    const unsubscribeConfigsLoaded = manager.subscribe('configsLoaded', (event) => {
      setConfigs(event.data || []);
    });

    const unsubscribeConfigAdded = manager.subscribe('configAdded', () => {
      setConfigs(manager.getConfigs());
    });

    const unsubscribeConfigUpdated = manager.subscribe('configUpdated', () => {
      setConfigs(manager.getConfigs());
    });

    const unsubscribeConfigDeleted = manager.subscribe('configDeleted', () => {
      setConfigs(manager.getConfigs());
    });

    const unsubscribeError = manager.subscribe('error', (event) => {
      setError(event.error?.message || '未知错误');
    });

    // 保存取消订阅函数
    unsubscribeRefs.current = [
      unsubscribeModelSelected,
      unsubscribeConfigsLoaded,
      unsubscribeConfigAdded,
      unsubscribeConfigUpdated,
      unsubscribeConfigDeleted,
      unsubscribeError
    ];

    // 清理函数
    return () => {
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
    };
  }, [storage]);

  // 设置当前模型
  const setCurrentModel = useCallback(async (modelId: string | null) => {
    if (!managerRef.current) return;
    
    try {
      setError(null);
      await managerRef.current.setCurrentModel(modelId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '设置模型失败');
    }
  }, []);

  // 添加配置
  const addConfig = useCallback(async (config: AIModelConfig) => {
    if (!managerRef.current) return Promise.reject(new Error('管理器未初始化'));
    
    try {
      setError(null);
      return await managerRef.current.addConfig(config);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加配置失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // 更新配置
  const updateConfig = useCallback(async (id: string, updates: Partial<AIModelConfig>) => {
    if (!managerRef.current) return Promise.reject(new Error('管理器未初始化'));
    
    try {
      setError(null);
      return await managerRef.current.updateConfig(id, updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新配置失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // 删除配置
  const deleteConfig = useCallback(async (id: string) => {
    if (!managerRef.current) return Promise.reject(new Error('管理器未初始化'));
    
    try {
      setError(null);
      await managerRef.current.deleteConfig(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除配置失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // 根据ID获取配置
  const getConfigById = useCallback((id: string) => {
    return managerRef.current?.getConfigById(id) || null;
  }, []);

  // 订阅事件
  const subscribe = useCallback((eventType: AIModelEventType, listener: (event: AIModelEventData) => void) => {
    if (!managerRef.current) return () => {};
    return managerRef.current.subscribe(eventType, listener);
  }, []);

  // 设置错误处理器
  const setErrorHandler = useCallback((handler: (error: Error, context: string) => void) => {
    if (managerRef.current) {
      managerRef.current.setErrorHandler(handler);
    }
  }, []);

  return {
    currentModel,
    currentModelId,
    configs,
    loading,
    error,
    isReady,
    setCurrentModel,
    addConfig,
    updateConfig,
    deleteConfig,
    getConfigById,
    subscribe,
    setErrorHandler
  };
}

// 简化的Hook - 只获取当前模型
export function useCurrentAIModel(storage?: StorageConfig): {
  currentModel: AIModelConfig | null;
  currentModelId: string | null;
  loading: boolean;
  error: string | null;
} {
  const { currentModel, currentModelId, loading, error } = useAIModel(storage);
  
  return {
    currentModel,
    currentModelId,
    loading,
    error
  };
}

// 配置管理Hook
export function useAIModelConfigs(storage?: StorageConfig): {
  configs: AIModelConfig[];
  loading: boolean;
  error: string | null;
  addConfig: (config: AIModelConfig) => Promise<AIModelConfig>;
  updateConfig: (id: string, updates: Partial<AIModelConfig>) => Promise<AIModelConfig>;
  deleteConfig: (id: string) => Promise<void>;
  getConfigById: (id: string) => AIModelConfig | null;
} {
  const { configs, loading, error, addConfig, updateConfig, deleteConfig, getConfigById } = useAIModel(storage);
  
  return {
    configs,
    loading,
    error,
    addConfig,
    updateConfig,
    deleteConfig,
    getConfigById
  };
}
