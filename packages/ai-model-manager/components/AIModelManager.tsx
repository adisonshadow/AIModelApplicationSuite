import React, { useState, useEffect, useCallback } from 'react';
import { AIModelConfig, AIProvider, AIProviderMeta, StorageConfig, ThemeMode } from '../types';
import { StorageManager } from '../utils/storage';
import { getProviderMeta } from '../utils/providers';
import AIModelConfModal from './AIModelConfModal';
import '../styles/index.css';

export interface AIModelManagerProps {
  // 是否显示管理界面
  visible: boolean;
  // 关闭管理界面回调
  onClose: () => void;
  // 主题模式
  theme?: ThemeMode;
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
  storage,
  supportedProviders = [
    AIProvider.OPENAI,
    AIProvider.DEEPSEEK,
    AIProvider.ANTHROPIC,
    AIProvider.GOOGLE,
    AIProvider.MISTRAL,
    AIProvider.VOLCENGINE
  ],
  customProviders = [],
  onConfigChange,
  className = '',
  customClassName = '', // 新增：接收自定义样式类名
  style
}) => {
  // 状态管理
  const [configs, setConfigs] = useState<AIModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModelConfig | undefined>();
  const [storageManager] = useState(() => new StorageManager(storage));

  // 获取支持的提供商元数据
  const getSupportedProviders = useCallback((): AIProviderMeta[] => {
    const providers: AIProviderMeta[] = [];
    
    // 添加默认支持的提供商
    supportedProviders.forEach(providerId => {
      const meta = getProviderMeta(providerId);
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
      setConfigs(loadedConfigs);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载配置失败');
    } finally {
      setLoading(false);
    }
  }, [storageManager]);

  // 组件挂载时加载数据
  useEffect(() => {
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
    if (!confirm('确认删除此AI模型配置吗？')) {
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
      setError(err instanceof Error ? err.message : '删除配置失败');
    }
  }, [storageManager, loadConfigs, onConfigChange]);

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
          <h3 className="ai-modal-title">
            AI模型配置管理
          </h3>
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
              正在加载配置...
            </div>
          ) : configs.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px', 
              color: 'var(--text-secondary)' 
            }}>
              <p>暂无AI模型配置</p>
              <p style={{ fontSize: '12px' }}>请先添加一些AI模型配置</p>
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
                      {config.enabled ? '启用' : '禁用'}
                    </span>
                    <button
                      className="ai-button secondary"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => handleEditModel(config)}
                    >
                      编辑
                    </button>
                    <button
                      className="ai-button secondary"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => handleToggleModel(config.id, !config.enabled)}
                    >
                      {config.enabled ? '禁用' : '启用'}
                    </button>
                    <button
                      className="ai-button danger"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => handleDeleteModel(config.id)}
                    >
                      删除
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
            共 {configs.length} 个配置
          </span>
          <button className="ai-button secondary" onClick={onClose}>
            关闭
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
            customClassName={customClassName}
          />
        )}
      </div>
    </div>
  );
};

export default AIModelManager;