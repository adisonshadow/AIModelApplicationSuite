import React, { useState, useEffect, useCallback } from 'react';
import { AIModelConfig, AIProvider, AIProviderMeta, StorageConfig, ThemeMode } from '../types';
import { StorageManager } from '../utils/storage';
import { getProviderMeta } from '../utils/providers';
import { getMessages } from '../utils/i18n';
import AIModelConfModal from './AIModelConfModal';
import '../styles/index.css';

export interface AIModelManagerProps {
  // 是否显示管理界面
  visible: boolean;
  // 关闭管理界面回调
  onClose: () => void;
  // 主题模式
  theme?: ThemeMode;
  // 语言设置
  locale?: 'en' | 'zh';
  // 数据存储方式配置
  storage?: StorageConfig;
  // 支持的AI提供商配置
  supportedProviders?: AIProvider[];
  // 自定义提供商元数据
  customProviders?: AIProviderMeta[];
  // 配置变化回调
  onConfigChange?: (configs: AIModelConfig[]) => void;
  // 自定义样式类名
  className?: string;
  // 自定义样式类名（用于主色调等样式）
  customClassName?: string;
  // 内联样式
  style?: React.CSSProperties;
}

export const AIModelManager: React.FC<AIModelManagerProps> = ({
  visible,
  onClose,
  theme = 'system',
  locale = 'en',
  storage,
  supportedProviders = [
    AIProvider.OPENAI,
    AIProvider.DEEPSEEK,
    AIProvider.ANTHROPIC,
    AIProvider.GOOGLE,
    AIProvider.VOLCENGINE
  ],
  customProviders = [],
  onConfigChange,
  className = '',
  customClassName = '', // 新增：接收自定义样式类名
  style
}) => {
  // 获取国际化消息
  const messages = getMessages(locale);
  // 状态管理
  const [configs, setConfigs] = useState<AIModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModelConfig | undefined>();
  const [storageManager] = useState(() => {
    const manager = new StorageManager(storage);
    console.log('🏪 AIModelManager 创建 StorageManager:', { 
      storage, 
      manager,
      storageConfig: manager.getStorageConfig()
    });
    return manager;
  });

  // 获取支持的提供商元数据
  const getSupportedProviders = useCallback((): AIProviderMeta[] => {
    const providers: AIProviderMeta[] = [];
    
    // 添加默认支持的提供商
    supportedProviders.forEach(providerId => {
      const meta = getProviderMeta(providerId, locale);
      if (meta) {
        providers.push(meta);
      }
    });
    
    // 添加自定义提供商
    customProviders.forEach(provider => {
      providers.push(provider);
    });
    
    return providers;
  }, [supportedProviders, customProviders]);

  // 生成主题类名
  const getThemeClassName = useCallback((): string => {
    const classes = ['ai-model-manager'];
    
    // 添加主题类名
    switch (theme) {
      case 'light':
        classes.push('theme-light');
        break;
      case 'dark':
        classes.push('theme-dark');
        break;
      case 'system':
      default:
        classes.push('theme-system');
        break;
    }
    
    // 添加自定义样式类名（如主色调、尺寸等）
    if (customClassName) {
      classes.push(customClassName);
    }
    
    return classes.join(' ');
  }, [theme, customClassName]);

  // 加载配置数据
  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const loadedConfigs = await storageManager.loadConfigs();
      console.log('📋 AIModelManager 加载配置:', loadedConfigs);
      setConfigs(loadedConfigs);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载配置失败');
      console.error('❌ AIModelManager 加载配置失败:', err);
    } finally {
      setLoading(false);
    }
  }, [storageManager]);

  // 组件挂载时加载数据
  useEffect(() => {
    console.log('🔄 AIModelManager useEffect:', { visible, storage, storageManager });
    if (visible) {
      loadConfigs();
    }
  }, [visible, loadConfigs]);

  // 处理编辑模型
  const handleEditModel = useCallback((model: AIModelConfig) => {
    setEditingModel(model);
    setShowEditModal(true);
  }, []);

  // 处理删除模型
  const handleDeleteModel = useCallback(async (modelId: string) => {
    if (!confirm(messages.confirmDeleteMessage)) {
      return;
    }
    
    try {
      await storageManager.deleteConfig(modelId);
      await loadConfigs();
      
      // 通知父组件配置已更新
      if (onConfigChange) {
        const updatedConfigs = await storageManager.loadConfigs();
        onConfigChange(updatedConfigs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete config');
    }
  }, [storageManager, loadConfigs, onConfigChange, messages]);

  // 处理启用/禁用模型
  const handleToggleModel = useCallback(async (modelId: string, enabled: boolean) => {
    try {
      await storageManager.updateConfig(modelId, { enabled });
      await loadConfigs();
      
      // 通知父组件配置已更新
      if (onConfigChange) {
        const updatedConfigs = await storageManager.loadConfigs();
        onConfigChange(updatedConfigs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新配置失败');
    }
  }, [storageManager, loadConfigs, onConfigChange]);

  // 处理保存模型配置
  const handleSaveModel = useCallback(async (config: AIModelConfig) => {
    try {
      await storageManager.saveConfig(config);
      setShowEditModal(false);
      setEditingModel(undefined);
      await loadConfigs();
      
      // 通知父组件配置已更新
      if (onConfigChange) {
        const updatedConfigs = await storageManager.loadConfigs();
        onConfigChange(updatedConfigs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存配置失败');
    }
  }, [storageManager, loadConfigs, onConfigChange]);

  // 处理关闭编辑弹窗
  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingModel(undefined);
  }, []);

  // 获取提供商显示名称
  const getProviderDisplayName = useCallback((provider: AIProvider): string => {
    const meta = getSupportedProviders().find(p => p.id === provider);
    return meta?.name || provider;
  }, [getSupportedProviders]);

  if (!visible) {
    return null;
  }

  console.log('AIModelManager 正在渲染，visible:', visible);

  return (
    <div className={`${getThemeClassName()} ai-modal-overlay`} onClick={onClose}>
      <div
        className={`ai-modal ai-model-manager-modal ${className}`}
        style={{ ...style, maxWidth: '800px', width: '90vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 弹窗头部 */}
        <div className="ai-modal-header">
          <span className="ai-modal-title">
            {messages.aiModelManager}
          </span>
          <button className="ai-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        {/* 弹窗内容 */}
        <div className="ai-modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
          {/* 错误提示 */}
          {error && (
            <div className="ai-error-message" style={{ 
              padding: '12px 16px', 
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 'var(--border-radius)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {/* 加载状态 */}
          {loading ? (
            <div className="ai-loading">
              <div className="ai-loading-spinner"></div>
              Loading...
            </div>
          ) : configs.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px', 
              color: 'var(--text-secondary)' 
            }}>
              <p>{messages.noConfigs}</p>
              <p style={{ fontSize: '12px' }}>{messages.clickAddToCreate}</p>
            </div>
          ) : (
            <div className="ai-model-list">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="ai-model-item"
                  style={{ marginBottom: '8px', position: 'relative' }}
                >
                  <div className="ai-model-info">
                    <div className="ai-model-name">{config.name}</div>
                    <div className="ai-model-provider">{getProviderDisplayName(config.provider)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      创建时间: {config.createdAt.toLocaleString()}
                    </div>
                  </div>
                  <div className="ai-model-actions" style={{ gap: '12px' }}>
                    <span className={`ai-model-status ${config.enabled ? 'enabled' : 'disabled'}`}>
                      {config.enabled ? messages.enabled : messages.disabled}
                    </span>
                    <button
                      className="ai-button secondary"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => handleEditModel(config)}
                    >
                      {messages.edit}
                    </button>
                    <button
                      className="ai-button secondary"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => handleToggleModel(config.id, !config.enabled)}
                    >
                      {config.enabled ? messages.disabled : messages.enabled}
                    </button>
                    <button
                      className="ai-button danger"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => handleDeleteModel(config.id)}
                    >
                      {messages.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 弹窗底部 */}
        <div className="ai-modal-footer">
          <span style={{ color: 'var(--text-secondary)', fontSize: '12px', marginRight: 'auto' }}>
            {configs.length} {locale === 'zh' ? '个配置' : 'config(s)'}
          </span>
          <button className="ai-button secondary" onClick={onClose}>
            {messages.close}
          </button>
        </div>

        {/* 编辑配置弹窗 */}
        {showEditModal && (
          <AIModelConfModal
            visible={showEditModal}
            onClose={handleCloseEditModal}
            editingModel={editingModel}
            onSave={handleSaveModel}
            supportedProviders={getSupportedProviders()}
            theme={theme}
            locale={locale}
            customClassName={customClassName}
          />
        )}
      </div>
    </div>
  );
};

export default AIModelManager;
