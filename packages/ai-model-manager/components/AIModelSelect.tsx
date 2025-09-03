import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AIModelSelectProps, AIModelConfig, AIProvider, AIProviderMeta } from '../types';
import { StorageManager } from '../utils/storage';
import { AIModelManager as Manager } from '../utils/manager';
import { getProviderMeta } from '../utils/providers';
import AIModelConfModal from './AIModelConfModal';
import AIModelManager from './AIModelManager';
import '../styles/index.css';

export const AIModelSelect: React.FC<AIModelSelectProps> = ({
  mode = 'select',
  selectedModelId,
  onModelChange,
  onConfigChange,
  theme = 'system',
  className = '',
  customClassName = '', // 新增：接收自定义样式类名
  style,
  storage,
  supportedProviders = [
    AIProvider.OPENAI,
    AIProvider.DEEPSEEK,
    AIProvider.ANTHROPIC,
    AIProvider.GOOGLE,
    AIProvider.MISTRAL
  ],
  customProviders = [],
  showAddButton = true,
  addButtonText = '添加AI模型',
  allowDelete = true,
  placeholder = '请选择AI模型',
  manager
}) => {
  // 状态管理
  const [configs, setConfigs] = useState<AIModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModelConfig | undefined>();
  const [storageManager] = useState(() => new StorageManager(storage));
  const [modelManager] = useState(() => manager || new Manager(storage));
  
  // 跟踪打开的菜单
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  // 加载配置数据
  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const loadedConfigs = await modelManager.loadConfigs();
      setConfigs(loadedConfigs);
      // 只有在没有传入 manager 时才调用 onConfigChange，避免重复
      if (!manager) {
        onConfigChange?.(loadedConfigs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载配置失败');
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
      if (currentConfigs.length > 0) {
        setConfigs(currentConfigs);
        setLoading(false);
      }
      // 如果配置为空，等待监听器通知
    }
  }, [loadConfigs, manager, modelManager]);

  // 监听管理器中的配置变化
  useEffect(() => {
    const unsubscribe = modelManager.onConfigsChange((newConfigs: AIModelConfig[]) => {
      setConfigs(newConfigs);
      setLoading(false); // 确保加载状态被清除
      // 只有在没有传入 manager 时才调用 onConfigChange，避免重复
      if (!manager) {
        onConfigChange?.(newConfigs);
      }
    });

    return unsubscribe;
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
    await modelManager.setSelectedModel(modelId);
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
    if (!confirm('确认删除此AI模型配置吗？')) {
      return;
    }
    
    try {
      await modelManager.deleteConfig(modelId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除配置失败');
    }
  }, [modelManager]);

  // 处理启用/禁用模型
  const handleToggleModel = useCallback(async (modelId: string, enabled: boolean) => {
    try {
      await modelManager.updateConfig(modelId, { enabled });
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新配置失败');
    }
  }, [modelManager]);

  // 处理保存模型配置
  const handleSaveModel = useCallback(async (config: AIModelConfig) => {
    try {
      await modelManager.saveConfig(config);
      setShowModal(false);
      setEditingModel(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存配置失败');
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

  // 渲染下拉选择模式
  const renderSelectMode = useCallback(() => {
    const enabledConfigs = configs.filter(config => config.enabled);
    const currentSelectedId = selectedModelId || modelManager.getSelectedModelId();
    
    const handleSelectChange = (value: string) => {
      if (value === '__add_model__') {
        handleAddModel();
      } else {
        handleModelSelect(value);
      }
    };
    
    return (
      <div className={`${getThemeClassName()} ai-model-select-dropdown ${className}`} style={style}>
        {/* 错误提示 */}
        {error && (
          <div className="ai-error-message" style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', marginBottom: '8px' }}>
            {error}
          </div>
        )}
        
        {/* 下拉选择器 */}
        <div className="ai-select-container">
          <select
            className="ai-select"
            value={currentSelectedId || ''}
            onChange={(e) => handleSelectChange(e.target.value)}
            disabled={loading}
          >
            <option value="" disabled>
              {loading ? '加载中...' : (enabledConfigs.length === 0 ? '暂无可用模型' : placeholder)}
            </option>
            {enabledConfigs.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name} ({getProviderDisplayName(config.provider)})
              </option>
            ))}
            {/* 添加模型选项 */}
            <option value="__add_model__" style={{ borderTop: '1px solid #e2e8f0', fontStyle: 'italic' }}>
              + 添加/配置模型
            </option>
          </select>
        </div>
        
        {/* 当前模型信息 */}
        {/* {(() => {
          const selectedConfig = enabledConfigs.find(config => config.id === currentSelectedId);
          return selectedConfig && (
            <div className="ai-selected-model-info">
              <div className="ai-model-name">{selectedConfig.name}</div>
              <div className="ai-model-provider">{getProviderDisplayName(selectedConfig.provider)}</div>
            </div>
          );
        })()} */}
        
        {/* 配置弹窗 */}
        {showModal && (
          <AIModelConfModal
            visible={showModal}
            onClose={handleCloseModal}
            editingModel={editingModel}
            onSave={handleSaveModel}
            onShowManager={handleShowManager}
            supportedProviders={getSupportedProviders()}
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
          />
        )}
      </div>
    );
  }, [configs, selectedModelId, modelManager, error, loading, getThemeClassName, className, style, placeholder, handleModelSelect, handleAddModel, getProviderDisplayName, showModal, showManager, handleCloseModal, handleCloseManager, editingModel, handleSaveModel, handleShowManager, getSupportedProviders, storage, supportedProviders, customProviders, customClassName, openMenuId]);

  // 渲染列表模式
  const renderListMode = useCallback(() => {
    const currentSelectedId = selectedModelId || modelManager.getSelectedModelId();
    
    return (
      <div className={`${getThemeClassName()} ai-model-select ${className}`} style={style}>
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
                {config.enabled ? '启用' : '禁用'}
              </span>
              <button
                className="ai-model-menu-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === config.id ? null : config.id);
                }}
                title="更多操作"
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
                  编辑
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
                  {config.enabled ? '禁用' : '启用'}
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
                    删除
                </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* 添加按钮 */}
        {showAddButton && (
          <div className="ai-model-add-button" onClick={handleAddModel}>
            <span>{addButtonText}</span>
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
          />
        )}
      </div>
    );
  }, [configs, selectedModelId, error, getThemeClassName, className, style, handleModelSelect, getProviderDisplayName, allowDelete, handleEditModel, handleToggleModel, handleDeleteModel, showAddButton, addButtonText, handleAddModel, showModal, handleCloseModal, editingModel, handleSaveModel, handleShowManager, getSupportedProviders, showManager, handleCloseManager, storage, supportedProviders, customProviders, customClassName]);

  // 渲染加载状态
  if (loading) {
    return (
      <div className={`${getThemeClassName()} ai-model-select ${className}`} style={style}>
        <div className="ai-loading">
          <div className="ai-loading-spinner"></div>
          正在加载配置...
        </div>
      </div>
    );
  }

  // 根据模式选择渲染方式
  return mode === 'select' ? renderSelectMode() : renderListMode();
};

export default AIModelSelect;