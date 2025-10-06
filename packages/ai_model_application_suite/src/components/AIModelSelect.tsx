import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AIModelSelectProps, AIModelConfig, AIProvider, AIProviderMeta } from '../types';
import { getGlobalAIModelManager } from '../utils/GlobalAIModelManager';
import { getProviderMeta } from '../utils/providers';
import { getMessages } from '../utils/i18n';
import AIModelConfModal from './AIModelConfModal';
import AIModelManager from './AIModelManager';
import '../styles/index.css';

export const AIModelSelect: React.FC<AIModelSelectProps> = ({
  mode = 'select',
  selectedModelId,
  onModelChange,
  onConfigChange,
  theme = 'system',
  locale = 'en',
  className = '',
  customClassName = '', // 新增：接收自定义样式类名
  style,
  storage,
  supportedProviders = [
    AIProvider.OPENAI,
    AIProvider.DEEPSEEK,
    AIProvider.ANTHROPIC,
    AIProvider.GOOGLE
  ],
  customProviders = [],
  showAddButton = true,
  addButtonText,
  allowDelete = true,
  placeholder,
  formatLabel,
  manager,
  width,
  block = false
}) => {
  // 获取国际化消息
  const messages = getMessages(locale);
  // 状态管理
  const [configs, setConfigs] = useState<AIModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModelConfig | undefined>();
  const [modelManager] = useState(() => manager || getGlobalAIModelManager(storage));
  
  // 跟踪打开的菜单
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  // 加载配置数据
  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // 新的全局管理器不需要手动加载，直接获取配置
      const loadedConfigs = modelManager.getConfigs();
      setConfigs(loadedConfigs);
      // 只有在没有传入 manager 时才调用 onConfigChange，避免重复
      if (!manager) {
        onConfigChange?.(loadedConfigs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configs');
    } finally {
      setLoading(false);
    }
  }, [modelManager, onConfigChange, manager]);

  // 组件挂载时加载数据
  useEffect(() => {
    if (!manager) {
      // 没有传入 manager 时，手动加载
      loadConfigs();
    } else {
      // 传入 manager 时，直接获取当前配置
      const currentConfigs = modelManager.getConfigs();
      setConfigs(currentConfigs);
      setLoading(false); // 无论配置是否为空，都设置 loading 为 false
    }
  }, [loadConfigs, manager, modelManager]);

  // 监听管理器中的配置变化
  useEffect(() => {
    const unsubscribeConfigsLoaded = modelManager.subscribe('configsLoaded', (event: any) => {
      const newConfigs = event.data || [];
      setConfigs(newConfigs);
      setLoading(false);
      if (!manager) {
        onConfigChange?.(newConfigs);
      }
    });

    const unsubscribeConfigAdded = modelManager.subscribe('configAdded', (_event: any) => {
      // 当添加新配置时，重新获取所有配置
      const newConfigs = modelManager.getConfigs();
      setConfigs(newConfigs);
      if (!manager) {
        onConfigChange?.(newConfigs);
      }
    });

    const unsubscribeConfigUpdated = modelManager.subscribe('configUpdated', (_event: any) => {
      // 当更新配置时，重新获取所有配置
      const newConfigs = modelManager.getConfigs();
      setConfigs(newConfigs);
      if (!manager) {
        onConfigChange?.(newConfigs);
      }
    });

    const unsubscribeConfigDeleted = modelManager.subscribe('configDeleted', (_event: any) => {
      // 当删除配置时，重新获取所有配置
      const newConfigs = modelManager.getConfigs();
      setConfigs(newConfigs);
      if (!manager) {
        onConfigChange?.(newConfigs);
      }
    });

    return () => {
      unsubscribeConfigsLoaded();
      unsubscribeConfigAdded();
      unsubscribeConfigUpdated();
      unsubscribeConfigDeleted();
    };
  }, [modelManager, onConfigChange, manager]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        const menuElement = menuRefs.current[openMenuId];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  // 处理模型选择
  const handleModelSelect = useCallback(async (modelId: string) => {
    await modelManager.setCurrentModel(modelId);
    // 只有在没有传入 manager 时才调用 onModelChange，避免重复
    if (!manager) {
      onModelChange?.(modelId);
    }
  }, [modelManager, onModelChange, manager]);

  // 处理添加新模型
  const handleAddModel = useCallback(() => {
    setEditingModel(undefined);
    setShowModal(true);
  }, []);

  // 处理编辑模型
  const handleEditModel = useCallback((model: AIModelConfig) => {
    setEditingModel(model);
    setShowModal(true);
  }, []);

  // 处理删除模型
  const handleDeleteModel = useCallback(async (modelId: string) => {
    if (!confirm(messages.confirmDeleteMessage)) {
      return;
    }
    
    try {
      await modelManager.deleteConfig(modelId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete config');
    }
  }, [modelManager, messages]);

  // 处理启用/禁用模型
  const handleToggleModel = useCallback(async (modelId: string, enabled: boolean) => {
    try {
      await modelManager.updateConfig(modelId, { enabled });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update config');
    }
  }, [modelManager]);

  // 处理保存模型配置
  const handleSaveModel = useCallback(async (config: AIModelConfig) => {
    try {
      await modelManager.addConfig(config);
      setShowModal(false);
      setEditingModel(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save config');
    }
  }, [modelManager]);

  // 处理关闭弹窗
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingModel(undefined);
  }, []);

  // 处理显示管理器
  const handleShowManager = useCallback(() => {
    setShowModal(false);
    setShowManager(true);
  }, []);

  // 处理关闭管理器
  const handleCloseManager = useCallback(() => {
    setShowManager(false);
  }, []);

  // 获取提供商显示名称
  const getProviderDisplayName = useCallback((provider: AIProvider): string => {
    const meta = getSupportedProviders().find(p => p.id === provider);
    return meta?.name || provider;
  }, [getSupportedProviders]);

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

  // 计算最终的样式（包含宽度设置）
  const getFinalStyle = useCallback((): React.CSSProperties => {
    const finalStyle: React.CSSProperties = { ...style };
    
    // 如果设置了 block，宽度设置为 100%
    if (block) {
      finalStyle.width = '100%';
      finalStyle.display = 'block';
    } 
    // 否则，如果设置了 width，使用指定的宽度
    else if (width !== undefined) {
      finalStyle.width = typeof width === 'number' ? `${width}px` : width;
      finalStyle.display = 'inline-block'; // 关键：让宽度生效
    }
    // 如果没有设置宽度，使用默认的 min-width
    else {
      finalStyle.minWidth = '200px';
      finalStyle.display = 'inline-block';
    }
    
    return finalStyle;
  }, [style, width, block]);

  // 计算 select 元素的样式
  const getSelectStyle = useCallback((): React.CSSProperties => {
    const selectStyle: React.CSSProperties = {
      boxSizing: 'border-box',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    };
    
    // 如果设置了 block，宽度设置为 100%
    if (block) {
      selectStyle.width = '100%';
      selectStyle.minWidth = 0;
      selectStyle.maxWidth = '100%';
    } 
    // 如果设置了 width
    else if (width !== undefined) {
      // 如果是百分比，select 设置为 100%（占满外层容器）
      if (typeof width === 'string' && width.includes('%')) {
        selectStyle.width = '100%';
        selectStyle.minWidth = 0;
        selectStyle.maxWidth = '100%';
      } 
      // 如果是像素值，直接使用
      else {
        const widthValue = typeof width === 'number' ? `${width}px` : width;
        selectStyle.width = widthValue;
        selectStyle.minWidth = 0;
        selectStyle.maxWidth = widthValue;
      }
    }
    // 如果没有设置宽度，使用默认的 min-width
    else {
      selectStyle.minWidth = '200px';
    }
    
    return selectStyle;
  }, [width, block]);

  // 渲染下拉选择模式
  const renderSelectMode = useCallback(() => {
    const enabledConfigs = configs.filter(config => config.enabled);
    const currentSelectedId = selectedModelId || modelManager.getCurrentModelId();
    
    const handleSelectChange = (value: string) => {
      if (value === '__add_model__') {
        handleAddModel();
      } else {
        handleModelSelect(value);
      }
    };
    
    return (
      <div className={`${getThemeClassName()} ai-model-select-dropdown ${className}`} style={getFinalStyle()}>
        {/* 错误提示 */}
        {error && (
          <div className="ai-error-message" style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', marginBottom: '8px' }}>
            {error}
          </div>
        )}
        
        {/* 下拉选择器 */}
        <div className="ai-select-container" style={{ width: '100%' }}>
          <select
            className="ai-select"
            value={currentSelectedId || ''}
            onChange={(e) => handleSelectChange(e.target.value)}
            disabled={loading}
            style={getSelectStyle()}
          >
            <option value="" disabled>
              {loading ? 'Loading...' : (enabledConfigs.length === 0 ? messages.noModelsAvailable : (placeholder || messages.selectPlaceholder))}
            </option>
            {enabledConfigs.map((config) => (
              <option key={config.id} value={config.id}>
                {formatLabel ? formatLabel(config) : `${config.name} (${getProviderDisplayName(config.provider)})`}
              </option>
            ))}
            {/* 添加模型选项 */}
            <option value="__add_model__" style={{ borderTop: '1px solid #e2e8f0', fontStyle: 'italic' }}>
              + {messages.addModel}
            </option>
          </select>
        </div>
        
        {/* 配置弹窗 */}
        {showModal && (
          <AIModelConfModal
            visible={showModal}
            onClose={handleCloseModal}
            editingModel={editingModel}
            onSave={handleSaveModel}
            onShowManager={handleShowManager}
            supportedProviders={getSupportedProviders()}
            theme={theme}
            locale={locale}
            customClassName={customClassName}
          />
        )}

        {/* 模型选择器 */}
        {showManager && (
          <AIModelManager
            visible={showManager}
            onClose={handleCloseManager}
            storage={storage}
            supportedProviders={supportedProviders}
            customProviders={customProviders}
            theme={theme}
            locale={locale}
          />
        )}
      </div>
    );
  }, [configs, selectedModelId, modelManager, error, loading, getThemeClassName, className, getFinalStyle, getSelectStyle, placeholder, handleModelSelect, handleAddModel, getProviderDisplayName, showModal, showManager, handleCloseModal, handleCloseManager, editingModel, handleSaveModel, handleShowManager, getSupportedProviders, storage, supportedProviders, customProviders, customClassName, openMenuId, messages, locale]);

  // 渲染列表模式
  const renderListMode = useCallback(() => {
    const currentSelectedId = selectedModelId || modelManager.getCurrentModelId();
    
    return (
      <div className={`${getThemeClassName()} ai-model-select ${className}`} style={getFinalStyle()}>
        {/* 错误提示 */}
        {error && (
          <div className="ai-error-message" style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)' }}>
            {error}
          </div>
        )}

        {/* 模型列表 */}
        {configs.map((config) => (
          <div
            key={config.id}
            className={`ai-model-item ${currentSelectedId === config.id ? 'selected' : ''}`}
            onClick={() => handleModelSelect(config.id)}
          >
            <div className="ai-model-info">
              <div className="ai-model-name">{config.name}</div>
              <div className="ai-model-provider">{getProviderDisplayName(config.provider)}</div>
            </div>
            <div className="ai-model-actions">
              <span className={`ai-model-status ${config.enabled ? 'enabled' : 'disabled'}`}>
                {config.enabled ? messages.enabled : messages.disabled}
              </span>
              <button
                className="ai-model-menu-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === config.id ? null : config.id);
                }}
                title={messages.actions}
              >
                ⋮
              </button>
              {/* 操作菜单 */}
              <div
                ref={(el) => { menuRefs.current[config.id] = el; }}
                className="ai-model-menu"
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '100%',
                  background: 'var(--bg-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 10,
                  minWidth: '120px',
                  display: openMenuId === config.id ? 'block' : 'none'
                }}
              >
                <button
                  className="ai-button secondary"
                  style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, border: 'none' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditModel(config);
                    setOpenMenuId(null);
                  }}
                >
                  {messages.edit}
                </button>
                <button
                  className="ai-button secondary"
                  style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, border: 'none' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleModel(config.id, !config.enabled);
                    setOpenMenuId(null);
                  }}
                >
                  {config.enabled ? messages.disabled : messages.enabled}
                </button>
                {allowDelete && (
                  <button
                    className="ai-button danger"
                    style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, border: 'none' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteModel(config.id);
                      setOpenMenuId(null);
                    }}
                  >
                    {messages.delete}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* 添加按钮 */}
        {showAddButton && (
          <div className="ai-model-add-button" onClick={handleAddModel}>
            <span>{addButtonText || messages.addModel}</span>
          </div>
        )}

        {/* 配置弹窗 */}
        {showModal && (
          <AIModelConfModal
            visible={showModal}
            onClose={handleCloseModal}
            editingModel={editingModel}
            onSave={handleSaveModel}
            onShowManager={handleShowManager}
            supportedProviders={getSupportedProviders()}
            theme={theme}
            locale={locale}
            customClassName={customClassName}
          />
        )}

        {/* 模型选择器 */}
        {showManager && (
          <AIModelManager
            visible={showManager}
            onClose={handleCloseManager}
            storage={storage}
            supportedProviders={supportedProviders}
            customProviders={customProviders}
            theme={theme}
            locale={locale}
          />
        )}
      </div>
    );
  }, [configs, selectedModelId, error, getThemeClassName, className, getFinalStyle, handleModelSelect, getProviderDisplayName, allowDelete, handleEditModel, handleToggleModel, handleDeleteModel, showAddButton, addButtonText, handleAddModel, showModal, handleCloseModal, editingModel, handleSaveModel, handleShowManager, getSupportedProviders, showManager, handleCloseManager, storage, supportedProviders, customProviders, customClassName, messages, locale, openMenuId]);

  // 渲染加载状态
  if (loading) {
    return (
      <div className={`${getThemeClassName()} ai-model-select ${className}`} style={getFinalStyle()}>
        <div className="ai-loading">
          <div className="ai-loading-spinner"></div>
          Loading...
        </div>
      </div>
    );
  }

  // 根据模式选择渲染方式
  return mode === 'select' ? renderSelectMode() : renderListMode();
};

export default AIModelSelect;
