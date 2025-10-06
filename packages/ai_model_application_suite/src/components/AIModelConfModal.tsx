import React, { useState, useEffect, useCallback } from 'react';
import { AIModelConfModalProps, AIModelConfig, AIProvider, AIProviderMeta, ProviderConfigField } from '../types';
import { generateId } from '../utils/storage';
import { validateProviderConfig } from '../utils/providers';
import { getMessages } from '../utils/i18n';
import '../styles/index.css';

export const AIModelConfModal: React.FC<AIModelConfModalProps> = ({
  visible,
  onClose,
  editingModel,
  onSave,
  supportedProviders,
  theme = 'system',
  locale = 'en',
  className = '',
  customClassName = '',
  style,
  onShowManager
}) => {
  // 获取国际化消息
  const messages = getMessages(locale);
  // 表单状态
  const [formData, setFormData] = useState<Partial<AIModelConfig>>({
    name: '',
    provider: AIProvider.OPENAI,
    enabled: true,
    config: { apiKey: '' }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [jsonParamsCollapsed, setJsonParamsCollapsed] = useState<boolean>(true);
  const [jsonValidationStatus, setJsonValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 获取主题类名
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
    
    return classes.join(' ');
  }, [theme]);

  // 初始化表单数据
  useEffect(() => {
    if (editingModel) {
      setFormData({
        ...editingModel,
        config: editingModel.config || { apiKey: '' }
      });
      
      // 如果有JSON参数且有内容，默认展开
      if (editingModel.config?.jsonParams) {
        setJsonParamsCollapsed(false);
      }
    } else {
      setFormData({
        name: '',
        provider: supportedProviders[0]?.id || AIProvider.OPENAI,
        enabled: true,
        config: { apiKey: '' }
      });
      
      // 重置折叠状态
      setJsonParamsCollapsed(true);
    }
    setErrors({});
  }, [editingModel, supportedProviders]);

  // 获取当前选中的提供商元数据
  const getCurrentProvider = useCallback((): AIProviderMeta | undefined => {
    return supportedProviders.find(p => p.id === formData.provider);
  }, [supportedProviders, formData.provider]);

  // 处理表单字段变化
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // 处理配置字段变化
  const handleConfigChange = useCallback((configKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        apiKey: '',
        ...prev.config,
        [configKey]: value
      }
    }));
    
    // 清除对应字段的错误
    const errorKey = `config.${configKey}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  }, [errors]);

  // 处理提供商变化
  const handleProviderChange = useCallback((providerId: AIProvider) => {
    const provider = supportedProviders.find(p => p.id === providerId);
    const defaultConfig: Record<string, any> = {};
    
    // 设置默认配置值
    if (provider?.configFields) {
      provider.configFields.forEach(field => {
        if (field.defaultValue !== undefined) {
          defaultConfig[field.key] = field.defaultValue;
        }
      });
    }
    
    // 为特定提供商设置固定配置
    if (providerId === AIProvider.VOLCENGINE) {
      defaultConfig.baseURL = 'https://ark.cn-beijing.volces.com/api/v3';
    }
    
    // 为所有模型设置默认JSON参数
    defaultConfig.jsonParams = '{\n  "temperature": 0.7,\n  "top_p": 0.9,\n  "max_tokens": 1000\n}';
    
    setFormData(prev => ({
      ...prev,
      provider: providerId,
      config: {
        apiKey: '',
        ...defaultConfig
      }
    }));
    setErrors({});
    
    // 保持折叠状态，不重置
    console.log('Provider changed, keeping collapse state:', jsonParamsCollapsed);
  }, [supportedProviders, jsonParamsCollapsed]);

  // 处理JSON参数折叠/展开
  const toggleJsonParams = useCallback(() => {
    console.log('toggleJsonParams called! Current state:', jsonParamsCollapsed);
    setJsonParamsCollapsed(prev => {
      console.log('Setting jsonParamsCollapsed from', prev, 'to', !prev);
      return !prev;
    });
  }, [jsonParamsCollapsed]);

  // 格式化JSON
  const handleJsonFormat = useCallback((fieldKey: string, value: string) => {
    if (!value.trim()) return;
    
    try {
      // 尝试解析JSON
      const parsed = JSON.parse(value);
      // 重新格式化
      const formatted = JSON.stringify(parsed, null, 2);
      handleConfigChange(fieldKey, formatted);
    } catch (error) {
      // 如果不是有效JSON，尝试解析类似Python风格的参数
      try {
        const pythonStyle = value.replace(/(\w+)\s*=\s*([^,\n]+)/g, '"$1": $2');
        const parsed = JSON.parse(`{${pythonStyle}}`);
        const formatted = JSON.stringify(parsed, null, 2);
        handleConfigChange(fieldKey, formatted);
      } catch (parseError) {
        // 如果都失败了，保持原值
        console.warn('JSON格式化失败:', parseError);
      }
    }
  }, [handleConfigChange]);

  // 验证JSON
  const handleJsonValidate = useCallback((fieldKey: string, value: string) => {
    if (!value.trim()) return;
    
    try {
      JSON.parse(value);
      // 清除错误
      const errorKey = `config.${fieldKey}`;
      if (errors[errorKey]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
      
      // 设置成功状态
      setJsonValidationStatus('success');
      
      // 3秒后重置状态
      setTimeout(() => {
        setJsonValidationStatus('idle');
      }, 3000);
      
    } catch (error) {
      // 设置错误状态
      setJsonValidationStatus('error');
      
      // 设置错误
      setErrors(prev => ({
        ...prev,
        [`config.${fieldKey}`]: messages.jsonFormatInvalid
      }));
      
      // 3秒后重置状态
      setTimeout(() => {
        setJsonValidationStatus('idle');
      }, 3000);
    }
  }, [errors]);

  // 验证表单
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    // 验证基本字段
    if (!formData.name?.trim()) {
      newErrors.name = messages.configNameRequired;
    }
    
    // 验证提供商配置
    const provider = getCurrentProvider();
    if (provider) {
      const configResult = validateProviderConfig(provider, formData.config || {}, locale);
      if (!configResult.valid) {
        configResult.errors.forEach((error, index) => {
          const field = provider.configFields?.[index];
          if (field) {
            newErrors[`config.${field.key}`] = error;
          }
        });
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, getCurrentProvider]);

  // 处理保存
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      const now = new Date();
      const config: AIModelConfig = {
        id: editingModel?.id || generateId(),
        name: formData.name!.trim(),
        provider: formData.provider!,
        enabled: formData.enabled ?? true,
        createdAt: editingModel?.createdAt || now,
        updatedAt: now,
        config: formData.config || { apiKey: '' },
        ...formData
      };
      
      await onSave(config);
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Save failed'
      });
    } finally {
      setSaving(false);
    }
  }, [formData, editingModel, validateForm, onSave]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  }, [onClose, handleSave]);

  // 渲染配置字段
  const renderConfigField = useCallback((field: ProviderConfigField) => {
    const value = formData.config?.[field.key] || '';
    const errorKey = `config.${field.key}`;
    const hasError = Boolean(errors[errorKey]);
    
    const commonProps = {
      id: field.key,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
        handleConfigChange(field.key, e.target.value),
      placeholder: field.placeholder
    };
    
    switch (field.type) {
      case 'select':
        return (
          <>
            <label
              className={`ai-form-label ${field.required ? 'required' : ''}`}
              htmlFor={field.key}
            >
              {field.label}
            </label>
            <select
              {...commonProps}
              className={`ai-form-select ${hasError ? 'error' : ''}`}
            >
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        );
      
      case 'autocomplete':
        return (
          <>
            <label
              className={`ai-form-label ${field.required ? 'required' : ''}`}
              htmlFor={field.key}
            >
              {field.label}
            </label>
            <div className="ai-autocomplete-container">
              <input
                {...commonProps}
                type="text"
                className={`ai-form-input ${hasError ? 'error' : ''}`}
                list={`${field.key}-suggestions`}
              />
              {field.suggestions && field.suggestions.length > 0 && (
                <datalist id={`${field.key}-suggestions`}>
                  {field.suggestions.map(suggestion => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
              )}
            </div>
          </>
        );
      
      case 'jsonarea':
        return (
          <div className="ai-jsonarea-container">
            <div className="ai-jsonarea-label">
              <label
                className={`ai-form-label ${field.required ? 'required' : ''}`}
                htmlFor={field.key}
              >
                {field.label}
              </label>
              <button
                type="button"
                className="ai-collapse-toggle"
                onClick={toggleJsonParams}
                aria-expanded={!jsonParamsCollapsed}
                title={jsonParamsCollapsed ? '点击展开' : '点击折叠'}
              >
                <span className="ai-collapse-icon">
                  {jsonParamsCollapsed ? '▶' : '▼'}
                </span>
              </button>
            </div>
            {!jsonParamsCollapsed && (
              <div className="ai-jsonarea-content">
                <textarea
                  {...commonProps}
                  className={`ai-form-textarea ${hasError ? 'error' : ''}`}
                  rows={8}
                  onChange={(e) => handleConfigChange(field.key, e.target.value)}
                  onBlur={(e) => handleJsonFormat(field.key, e.target.value)}
                />
                <div className="ai-jsonarea-actions">
                  <button
                    type="button"
                    className="ai-button secondary small"
                    onClick={() => handleJsonFormat(field.key, value)}
                  >
                    {messages.formatJson}
                  </button>
                  <button
                    type="button"
                    className={`ai-button small ${
                      jsonValidationStatus === 'success' 
                        ? 'success' 
                        : jsonValidationStatus === 'error' 
                        ? 'danger' 
                        : 'secondary'
                    }`}
                    onClick={() => handleJsonValidate(field.key, value)}
                    disabled={jsonValidationStatus === 'success'}
                  >
                    {jsonValidationStatus === 'success' ? messages.validationSuccess : messages.validateJson}
                  </button>
                  {jsonValidationStatus === 'success' && (
                    <span className="validation-success-message">{messages.validationSuccessMsg}</span>
                  )}
                  {jsonValidationStatus === 'error' && (
                    <span className="validation-error-message">{messages.validationErrorMsg}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'boolean':
        return (
          <>
            <label
              className={`ai-form-label ${field.required ? 'required' : ''}`}
              htmlFor={field.key}
            >
              {field.label}
            </label>
            <label className="ai-switch">
              <input
                id={field.key}
                type="checkbox"
                className="ai-switch-input"
                checked={Boolean(value)}
                onChange={(e) => handleConfigChange(field.key, e.target.checked)}
              />
              <span className="ai-switch-slider"></span>
            </label>
          </>
        );
      
      default:
        return (
          <>
            <label
              className={`ai-form-label ${field.required ? 'required' : ''}`}
              htmlFor={field.key}
            >
              {field.label}
            </label>
            <input
              {...commonProps}
              type={field.type === 'password' ? 'password' : 'text'}
              className={`ai-form-input ${hasError ? 'error' : ''}`}
            />
          </>
        );
    }
  }, [formData.config, errors, handleConfigChange, toggleJsonParams, jsonParamsCollapsed]);

  if (!visible) {
    return null;
  }

  const currentProvider = getCurrentProvider();
  const isEditing = Boolean(editingModel);

  return (
    <div className={`${getThemeClassName()} ai-modal-overlay`} onKeyDown={handleKeyDown}>
      <div
        className={`ai-modal ${className} ${customClassName}`}
        style={style}
      >
        {/* 弹窗头部 */}
        <div className="ai-modal-header">
          <span className="ai-modal-title">
            {isEditing ? messages.editAIModel : messages.addAIModel}
          </span>
          <button className="ai-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        {/* 弹窗内容 */}
        <div className="ai-modal-body">
          {/* AI提供商选择 - 移到最前面 */}
          <div className="ai-form-group">
            <label className="ai-form-label required" htmlFor="provider">
              {messages.aiProvider}
            </label>
            <select
              id="provider"
              className="ai-form-select"
              value={formData.provider}
              onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
            >
              {supportedProviders.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* 配置名称 */}
          <div className="ai-form-group">
            <label className="ai-form-label required" htmlFor="name">
              {messages.configName}
            </label>
            <input
              id="name"
              type="text"
              className={`ai-form-input ${errors.name ? 'error' : ''}`}
              value={formData.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder={messages.configNamePlaceholder}
            />
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {messages.configNameHelper}
            </div>
            {errors.name && <div className="ai-error-message">{errors.name}</div>}
          </div>
          
          {/* 动态配置字段 */}
          {currentProvider?.configFields?.map(field => (
            <div key={field.key} className="ai-form-group">
              {renderConfigField(field)}
              {/* 为Model字段添加特殊说明 */}
              {field.key === 'model' && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {messages.modelIdHelper}
                </div>
              )}
              {/* 为API Key字段添加说明 */}
              {field.key === 'apiKey' && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {messages.apiKeyHelper}
                </div>
              )}
              {errors[`config.${field.key}`] && (
                <div className="ai-error-message">{errors[`config.${field.key}`]}</div>
              )}
            </div>
          ))}
          
          {/* 额外JSON参数 - 所有模型都有的基础字段 */}
          <div className="ai-form-group">
            <div className="ai-jsonarea-container">
              <div className="ai-jsonarea-label">
                <label
                  className="ai-form-label"
                  htmlFor="jsonParams"
                >
                  {messages.extraJsonParams}
                </label>
                <button
                  type="button"
                  className="ai-collapse-toggle"
                  onClick={toggleJsonParams}
                  aria-expanded={!jsonParamsCollapsed}
                  title={jsonParamsCollapsed ? messages.clickToExpand : messages.clickToCollapse}
                >
                  <span className="ai-collapse-icon">
                    {jsonParamsCollapsed ? '▶' : '▼'}
                  </span>
                </button>
              </div>
              {!jsonParamsCollapsed && (
                <div className="ai-jsonarea-content">
                  <textarea
                  id="jsonParams"
                  className={`ai-form-textarea ${errors['config.jsonParams'] ? 'error' : ''}`}
                  value={formData.config?.jsonParams || ''}
                  onChange={(e) => handleConfigChange('jsonParams', e.target.value)}
                  onBlur={(e) => handleJsonFormat('jsonParams', e.target.value)}
                  placeholder={messages.extraJsonParamsPlaceholder}
                  rows={8}
                />
                <div className="ai-jsonarea-actions">
                  <button
                    type="button"
                    className="ai-button secondary small"
                    onClick={() => handleJsonFormat('jsonParams', formData.config?.jsonParams || '')}
                  >
                    {messages.formatJson}
                  </button>
                  <button
                    type="button"
                    className={`ai-button small ${
                      jsonValidationStatus === 'success' 
                        ? 'success' 
                        : jsonValidationStatus === 'error' 
                        ? 'danger' 
                        : 'secondary'
                    }`}
                    onClick={() => handleJsonValidate('jsonParams', formData.config?.jsonParams || '')}
                    disabled={jsonValidationStatus === 'success'}
                  >
                    {jsonValidationStatus === 'success' ? messages.validationSuccess : messages.validateJson}
                  </button>
                  {jsonValidationStatus === 'success' && (
                    <span className="validation-success-message">{messages.validationSuccessMsg}</span>
                  )}
                  {jsonValidationStatus === 'error' && (
                    <span className="validation-error-message">{messages.validationErrorMsg}</span>
                  )}
                  </div>
                </div>
              )}
              {errors['config.jsonParams'] && (
                <div className="ai-error-message">{errors['config.jsonParams']}</div>
              )}
            </div>
          </div>
          
          {/* 启用状态 */}
          <div className="ai-form-group">
            <label className="ai-form-label" htmlFor="enabled">
              {messages.enabledStatus}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="ai-switch">
                <input
                  id="enabled"
                  type="checkbox"
                  className="ai-switch-input"
                  checked={formData.enabled ?? true}
                  onChange={(e) => handleFieldChange('enabled', e.target.checked)}
                />
                <span className="ai-switch-slider"></span>
              </label>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {formData.enabled ? messages.enabled : messages.disabled}
              </span>
            </div>
          </div>
          
          {/* 提交错误 */}
          {errors.submit && (
            <div className="ai-error-message" style={{ marginTop: '16px' }}>
              {errors.submit}
            </div>
          )}
        </div>
        
        {/* 弹窗底部 */}
        <div className="ai-modal-footer">
          {onShowManager && (
            <button 
              className="ai-button secondary" 
              onClick={onShowManager}
              style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 1024 1024" 
                fill="currentColor"
                style={{ flexShrink: 0 }}
              >
                <path d="M511.9935 699.733c-102.4 0-187.733-85.333-187.733-187.733s85.333-187.733 187.733-187.733S699.7265 409.6 699.7265 512s-85.333 187.733-187.733 187.733z m472.177-250.311c-5.689-22.756-22.756-39.822-45.511-45.511l-11.378-5.689c-34.133-11.378-68.267-34.133-91.022-68.267s-22.756-73.956-17.067-113.778l5.689-11.378c5.689-17.067 0-45.511-17.067-62.578 0 0-17.067-11.378-56.889-34.133s-56.889-28.444-56.889-28.444c-22.756-5.689-45.511 0-62.578 17.067l-11.378 11.378c-28.444 22.756-68.267 39.822-108.089 39.822s-79.644-17.067-108.089-39.822l-5.689-17.067c-17.067-11.378-45.511-22.756-62.578-11.378 0 0-17.067 5.689-56.889 28.444s-56.889 34.133-56.889 34.133c-17.067 17.067-28.444 39.822-22.756 62.578l5.689 17.067c11.378 34.133 5.689 73.956-17.067 113.778-22.756 28.444-51.2 51.2-91.022 62.578l-11.378 5.689c-22.756 0-39.822 22.756-45.511 45.511 0 0-5.689 17.067-5.689 62.578s5.689 62.578 5.689 62.578c5.689 22.756 22.756 39.822 45.511 45.511l11.378 5.689c34.133 11.378 68.267 34.133 91.022 68.267s22.756 73.956 17.067 113.778l-5.689 11.378c-5.689 17.067 0 45.511 17.067 62.578 0 0 17.067 11.378 56.889 34.133s56.889 28.444 56.889 28.444c22.756 5.689 45.511 0 62.578-17.067l11.378-11.378c28.444-28.444 62.578-39.822 108.089-39.822 39.822 0 79.644 17.067 108.089 39.822l11.378 11.378c17.067 17.067 39.822 22.756 62.578 17.067 0 0 17.067-5.689 56.889-28.444s56.889-34.133 56.889-34.133 22.756-39.822 17.067-62.578l-5.689-17.067c-11.378-34.133-5.689-73.956 17.067-108.089s51.2-56.889 91.022-68.267l17.067-5.689c22.756-5.689 39.822-22.756 45.511-45.511 0 0 5.689-17.067 5.689-62.578-5.689-45.511-11.378-62.578-11.378-62.578z"></path>
              </svg>
              {messages.manageConfigs}
            </button>
          )}
          <button className="ai-button secondary" onClick={onClose}>
            {messages.cancel}
          </button>
          <button
            className="ai-button primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="ai-loading-spinner"></div>
                {messages.saving}
              </>
            ) : (
              messages.save
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIModelConfModal;
