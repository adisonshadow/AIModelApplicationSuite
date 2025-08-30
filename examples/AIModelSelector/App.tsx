import React, { useState, useCallback, useEffect } from 'react';
import { AIModelSelect, AIModelManager } from '../../packages/ai-model-manager';
import { AIModelConfig, AIProvider, StorageConfig, ThemeMode } from '../../packages/ai-model-manager/types';

// 模拟API调用的演示
const mockAPI = {
  async getConfigs(): Promise<AIModelConfig[]> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const stored = localStorage.getItem('demo-api-configs');
    if (stored) {
      return JSON.parse(stored).map((config: any) => ({
        ...config,
        createdAt: new Date(config.createdAt),
        updatedAt: new Date(config.updatedAt)
      }));
    }
    
    return [
      {
        id: 'demo-1',
        name: 'GPT-4 Demo',
        provider: AIProvider.OPENAI,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {
          apiKey: 'sk-demo-key-hidden',
          baseURL: 'https://api.openai.com/v1',
          model: 'gpt-4'
        }
      },
      {
        id: 'demo-2',
        name: 'DeepSeek Demo',
        provider: AIProvider.DEEPSEEK,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {
          apiKey: 'sk-demo-deepseek-key',
          baseURL: 'https://api.deepseek.com/v1',
          model: 'deepseek-v3-1-250821'
        }
      },
      {
        id: 'demo-3',
        name: 'Anthropic Demo',
        provider: AIProvider.ANTHROPIC,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {
          apiKey: 'sk-ant-demo-key',
          baseURL: 'https://api.anthropic.com',
          model: 'claude-3-sonnet-20240229'
        }
      },
      {
        id: 'demo-4',
        name: 'Volcengine Demo',
        provider: AIProvider.VOLCENGINE,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {
          apiKey: 'sk-volcengine-demo-key',
          baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
          model: 'gpt-3.5-turbo'
        }
      }
    ];
  },
  
  async saveConfig(config: AIModelConfig): Promise<AIModelConfig> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const stored = localStorage.getItem('demo-api-configs');
    const configs = stored ? JSON.parse(stored) : [];
    
    const existingIndex = configs.findIndex((c: any) => c.id === config.id);
    const serializedConfig = {
      ...config,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString()
    };
    
    if (existingIndex >= 0) {
      configs[existingIndex] = serializedConfig;
    } else {
      configs.push(serializedConfig);
    }
    
    localStorage.setItem('demo-api-configs', JSON.stringify(configs));
    return config;
  },
  
  async deleteConfig(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const stored = localStorage.getItem('demo-api-configs');
    if (stored) {
      const configs = JSON.parse(stored);
      const filtered = configs.filter((c: any) => c.id !== id);
      localStorage.setItem('demo-api-configs', JSON.stringify(filtered));
    }
  },
  
  async updateConfig(id: string, updates: Partial<AIModelConfig>): Promise<AIModelConfig> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const stored = localStorage.getItem('demo-api-configs');
    const configs = stored ? JSON.parse(stored) : [];
    
    const existingIndex = configs.findIndex((c: any) => c.id === id);
    if (existingIndex >= 0) {
      const config = {
        ...configs[existingIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      configs[existingIndex] = config;
      localStorage.setItem('demo-api-configs', JSON.stringify(configs));
      
      return {
        ...config,
        createdAt: new Date(config.createdAt),
        updatedAt: new Date(config.updatedAt)
      };
    }
    
    throw new Error(`Config with id ${id} not found`);
  }
};

const DemoApp: React.FC = () => {
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [configs, setConfigs] = useState<AIModelConfig[]>([]);
  const [storageType, setStorageType] = useState<'localStorage' | 'api'>('localStorage');
  const [customStyle, setCustomStyle] = useState(false);
  const [showManager, setShowManager] = useState(false);
  
  // 新增的样式配置选项
  const [themeMode, setThemeMode] = useState<ThemeMode>('system'); // 主题模式
  const [primaryColor, setPrimaryColor] = useState<string>('blue');
  const [size, setSize] = useState<string>('normal');
  const [borderRadius, setBorderRadius] = useState<string>('default');
  const [shadow, setShadow] = useState<string>('default');
  const [animation, setAnimation] = useState<boolean>(false);
  const [gradient, setGradient] = useState<boolean>(false);
  const [hoverEffect, setHoverEffect] = useState<string>('none');
  // const [width, setWidth] = useState<string>('auto'); // 暂时注释掉

  // 存储配置
  const storageConfig: StorageConfig = storageType === 'api' 
    ? {
        type: 'api',
        api: mockAPI
      }
    : {
        type: 'localStorage',
        localStorageKey: 'demo-local-configs'
      };

  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
    console.log('选中的模型ID:', modelId);
  }, []);

  const handleConfigChange = useCallback((newConfigs: AIModelConfig[]) => {
    setConfigs(newConfigs);
    console.log('配置更新:', newConfigs);
  }, []);

  // 生成自定义样式类名
  const getCustomClassName = useCallback(() => {
    const classes: string[] = [];
    
    if (customStyle) {
      classes.push('custom-demo-style');
    }
    
    // 始终添加主色调类，包括默认的蓝色
    classes.push(`color-${primaryColor}`);
    
    if (size !== 'normal') {
      classes.push(`size-${size}`);
    }
    
    if (borderRadius !== 'default') {
      classes.push(`rounded-${borderRadius}`);
    }
    
    if (shadow !== 'default') {
      classes.push(`shadow-${shadow}`);
    }
    
    if (animation) {
      classes.push('animated');
    }
    
    if (gradient) {
      classes.push('gradient-bg');
    }
    
    if (hoverEffect !== 'none') {
      classes.push(`hover-${hoverEffect}`);
    }
    
    // 暂时注释掉宽度设置
    // if (width !== 'auto') {
    //   classes.push(`width-${width}`);
    // }
    
    return classes.join(' ');
  }, [customStyle, primaryColor, size, borderRadius, shadow, animation, gradient, hoverEffect, themeMode]);

  // 生成主色调相关的样式对象
  const getPrimaryColorStyles = useCallback(() => {
    const colorMap = {
      blue: {
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        primaryLight: 'rgba(59, 130, 246, 0.1)',
        primaryGlow: 'rgba(59, 130, 246, 0.3)'
      },
      purple: {
        primary: '#8b5cf6',
        primaryHover: '#7c3aed',
        primaryLight: 'rgba(139, 92, 246, 0.1)',
        primaryGlow: 'rgba(139, 92, 246, 0.3)'
      },
      green: {
        primary: '#10b981',
        primaryHover: '#059669',
        primaryLight: 'rgba(16, 185, 129, 0.1)',
        primaryGlow: 'rgba(16, 185, 129, 0.3)'
      },
      orange: {
        primary: '#f59e0b',
        primaryHover: '#d97706',
        primaryLight: 'rgba(245, 158, 11, 0.1)',
        primaryGlow: 'rgba(245, 158, 11, 0.3)'
      },
      red: {
        primary: '#ef4444',
        primaryHover: '#dc2626',
        primaryLight: 'rgba(239, 68, 68, 0.1)',
        primaryGlow: 'rgba(239, 68, 68, 0.3)'
      }
    };
    
    return colorMap[primaryColor as keyof typeof colorMap] || colorMap.blue;
  }, [primaryColor]);

  // 动态样式注入器
  useEffect(() => {
    if (!customStyle) return;
    
    const styles = getPrimaryColorStyles();
    const styleId = 'dynamic-primary-color-styles';
    
    // 移除旧的样式
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // 创建新的样式元素
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
      /* 动态生成的主色调样式 */
      .ai-model-item.selected {
        background-color: ${styles.primaryLight} !important;
        border-left: 3px solid ${styles.primary} !important;
      }
      
      .ai-model-add-button:hover {
        background-color: ${styles.primaryLight} !important;
        border-color: ${styles.primary} !important;
        color: ${styles.primary} !important;
      }
      
      .ai-form-input:focus,
      .ai-form-select:focus,
      .ai-form-textarea:focus {
        border-color: ${styles.primary} !important;
        box-shadow: 0 0 0 3px ${styles.primaryGlow} !important;
      }
      
      .ai-select:focus {
        border-color: ${styles.primary} !important;
        box-shadow: 0 0 0 3px ${styles.primaryGlow} !important;
      }
      
      .ai-switch-input:checked + .ai-switch-slider {
        background-color: ${styles.primary} !important;
      }
      
      .ai-button.primary {
        background-color: ${styles.primary} !important;
      }
      
      .ai-button.primary:hover:not(:disabled) {
        background-color: ${styles.primaryHover} !important;
      }
      
      .ai-loading-spinner {
        border-top-color: ${styles.primary} !important;
      }
      
      .ai-model-manager.hover-slide .ai-model-item:hover {
        border-left-color: ${styles.primary} !important;
      }
      
      .ai-model-manager.hover-glow .ai-model-item:hover {
        box-shadow: 0 0 20px ${styles.primaryGlow} !important;
      }
      
      .ai-model-manager.gradient-bg .ai-model-item.selected {
        background: linear-gradient(135deg, ${styles.primaryLight}, #f8fafc) !important;
      }
    `;
    
    // 注入到页面头部
    document.head.appendChild(styleElement);
    
    // 清理函数
    return () => {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, [customStyle, getPrimaryColorStyles]);

  return (
    <>
      <div style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
      <h1 style={{ color: '#1e293b', marginBottom: '8px' }}>
        React AI Model Manager 🚚 演示
      </h1>
      <p style={{ color: '#64748b', marginBottom: '32px' }}>
        这是一个用于AI模型配置和选择的React组件包演示页面
      </p>

      {/* 配置选项 */}
      <div style={{ 
        background: '#f8fafc', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '32px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ color: '#1e293b', marginTop: 0, marginBottom: '16px' }}>
          演示配置
        </h3>
        
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ color: '#374151', fontWeight: 500, marginRight: '8px' }}>
              存储方式:
            </label>
            <select
              value={storageType}
              onChange={(e) => setStorageType(e.target.value as 'localStorage' | 'api')}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            >
              <option value="localStorage">LocalStorage</option>
              <option value="api">API模式</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="customStyle"
              checked={customStyle}
              onChange={(e) => setCustomStyle(e.target.checked)}
            />
            <label htmlFor="customStyle" style={{ color: '#374151', fontWeight: 500 }}>
              启用自定义样式
            </label>
          </div>

          {/* 管理按钮 */}
          <div style={{ marginLeft: '16px', display: 'flex', justifyContent: 'center' }}>
            <button
                style={{
                padding: '8px 16px',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
                }}
                onClick={() => {
                  console.log('点击了管理按钮，设置 showManager 为 true');
                  setShowManager(true);
                }}
            >
                 ⚒️ AI模型配置
            </button>
            {showManager && (
              <span style={{ marginLeft: '8px', color: '#059669', fontSize: '12px' }}>
                (管理器已打开)
              </span>
            )}
          </div>

        </div>
        
        {/* 自定义样式控制面板 */}
        {customStyle && (
          <div style={{ 
            marginTop: '20px', 
            padding: '16px', 
            background: '#f8fafc', 
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '14px' }}>
              🎨 样式自定义选项
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {/* 主题模式选择 */}
              {/* <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  主题模式
                </label>
                <select
                  value={themeMode}
                  onChange={(e) => setThemeMode(e.target.value as ThemeMode)}
                  style={{ width: '100%', padding: '4px 8px', fontSize: '12px', borderRadius: '4px' }}
                >
                  <option value="light">☀️ 亮色模式</option>
                  <option value="dark">🌙 暗色模式</option>
                  <option value="system">💻 系统自动</option>
                </select>
              </div> */}
              
              {/* 主色调选择 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  主色调
                </label>
                <select
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ width: '100%', padding: '4px 8px', fontSize: '12px', borderRadius: '4px' }}
                >
                  <option value="blue">🔵 蓝色</option>
                  <option value="purple">🟣 紫色</option>
                  <option value="green">🟢 绿色</option>
                  <option value="orange">🟠 橙色</option>
                  <option value="red">🔴 红色</option>
                </select>
              </div>
              
              {/* 尺寸选择 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  组件尺寸
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  style={{ width: '100%', padding: '4px 8px', fontSize: '12px', borderRadius: '4px' }}
                >
                  <option value="compact">🔍 紧凑</option>
                  <option value="normal">📱 正常</option>
                  <option value="large">💻 大号</option>
                </select>
              </div>
              
              {/* 圆角选择 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  圆角大小
                </label>
                <select
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(e.target.value)}
                  style={{ width: '100%', padding: '4px 8px', fontSize: '12px', borderRadius: '4px' }}
                >
                  <option value="none">◼️ 无圆角</option>
                  <option value="sm">🔹 小圆角</option>
                  <option value="default">🔸 默认</option>
                  <option value="lg">🔶 大圆角</option>
                  <option value="full">⭕ 全圆角</option>
                </select>
              </div>
              
              {/* 阴影选择 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  阴影效果
                </label>
                <select
                  value={shadow}
                  onChange={(e) => setShadow(e.target.value)}
                  style={{ width: '100%', padding: '4px 8px', fontSize: '12px', borderRadius: '4px' }}
                >
                  <option value="default">🌅 默认</option>
                  <option value="none">🌆 无阴影</option>
                  <option value="inner">🌇 内阴影</option>
                  <option value="outline">🌄 轮廓阴影</option>
                </select>
              </div>
              
              {/* 悬停效果选择 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  悬停效果
                </label>
                <select
                  value={hoverEffect}
                  onChange={(e) => setHoverEffect(e.target.value)}
                  style={{ width: '100%', padding: '4px 8px', fontSize: '12px', borderRadius: '4px' }}
                >
                  <option value="none">🚫 无效果</option>
                  <option value="scale">🔍 缩放</option>
                  <option value="slide">➡️ 滑动</option>
                  <option value="glow">✨ 发光</option>
                  <option value="fade">🌫️ 淡入淡出</option>
                </select>
              </div>
              
              {/* 组件宽度 - 暂时注释掉 */}
              {/*
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  组件宽度
                </label>
                <select
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  style={{ width: '100%', padding: '4px 8px', fontSize: '12px', borderRadius: '4px' }}
                >
                  <option value="auto">📱 自适应</option>
                  <option value="sm">📱 小尺寸</option>
                  <option value="md">📱 中等</option>
                  <option value="lg">📱 大尺寸</option>
                  <option value="full">📱 全宽</option>
                </select>
              </div>
              */}
            </div>
            
            <div style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151' }}>
                <input
                  type="checkbox"
                  checked={animation}
                  onChange={(e) => setAnimation(e.target.checked)}
                />
                ✨ 启用基础动画效果 (上移、按钮缩放)
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151' }}>
                <input
                  type="checkbox"
                  checked={gradient}
                  onChange={(e) => setGradient(e.target.checked)}
                />
                🌈 启用渐变背景
              </label>
            </div>
          </div>
        )}
        
        <div style={{ marginTop: '16px', fontSize: '14px', color: '#64748b' }}>
          <p>• <strong>LocalStorage模式</strong>: 数据保存在浏览器本地存储中</p>
          <p>• <strong>API模式</strong>: 模拟通过API保存数据（实际上也是存储在LocalStorage，但模拟了网络请求）</p>
        </div>
      </div>

      {/* 当前状态显示 */}
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '32px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ color: '#1e293b', marginTop: 0, marginBottom: '16px' }}>
          当前状态
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <strong style={{ color: '#374151' }}>选中的模型ID:</strong>
            <div style={{ color: '#059669', fontFamily: 'monospace', marginTop: '4px' }}>
              {selectedModelId || '(未选择)'}
            </div>
          </div>
          
          <div>
            <strong style={{ color: '#374151' }}>配置数量:</strong>
            <div style={{ color: '#059669', fontFamily: 'monospace', marginTop: '4px' }}>
              {configs.length} 个配置
            </div>
          </div>
        </div>
        
        {configs.length > 0 && (
          <details style={{ marginTop: '16px' }}>
            <summary style={{ cursor: 'pointer', color: '#6366f1', fontWeight: 500 }}>
              查看所有配置 (JSON)
            </summary>
            <pre style={{ 
              background: '#f8fafc',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              marginTop: '8px',
              border: '1px solid #e2e8f0'
            }}>
              {JSON.stringify(configs, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* 主要演示区域 */}
      <div style={{ 
        background: '#f1f1f1', 
        color: '#111',
        padding: '20px', 
        borderRadius: '8px', 
        marginTop: '32px',
        border: '1px solidrgb(183, 183, 183)'
      }}>
        <h3 style={{ color: '#000', marginTop: 0, marginBottom: '16px' }}>
          🌖 亮色主题演示
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '20px' }}>
            {/* 下拉选择模式（默认） */}
            <div>
            <h4 style={{ color: '#1e293b', marginBottom: '16px' }}>
                ✨ 下拉选择模式 (默认)
            </h4>
            <div className={`ai-model-manager ${getCustomClassName()}`}>
              <AIModelSelect
                  mode="select"
                  theme="light"
                  selectedModelId={selectedModelId}
                  onModelChange={handleModelChange}
                  onConfigChange={handleConfigChange}
                  storage={storageConfig}
                  supportedProviders={[
                    AIProvider.OPENAI,
                    AIProvider.OPENAILIKE,
                    AIProvider.DEEPSEEK,
                    AIProvider.ANTHROPIC,
                    AIProvider.GOOGLE
                  ]}
                  placeholder="选择一个AI模型..."
                  customClassName={getCustomClassName()}
              />
            </div>
            </div>

            {/* 列表模式 */}
            <div>
            <h4 style={{ color: '#1e293b', marginBottom: '16px' }}>
                ✨ 列表模式
            </h4>
            <div className={`ai-model-manager ${getCustomClassName()}`}>
              <AIModelSelect
                  mode="list"
                  theme="light"
                  selectedModelId={selectedModelId}
                  onModelChange={handleModelChange}
                  onConfigChange={handleConfigChange}
                  storage={storageConfig}
                  supportedProviders={[
                    AIProvider.OPENAI,
                    AIProvider.OPENAILIKE,
                    AIProvider.DEEPSEEK,
                    AIProvider.ANTHROPIC,
                    AIProvider.GOOGLE,
                    AIProvider.OLLAMA,
                    AIProvider.MISTRAL,
                    AIProvider.VOLCENGINE
                  ]}
                  addButtonText="➕ 添加AI模型"
                  allowDelete={true}
                  style={{ 
                  minWidth: '100%'
                  }}
                  customClassName={getCustomClassName()}
              />
            </div>
            </div>
        </div>
      </div>

      {/* 暗色主题演示区域 */}
      <div style={{ 
        background: '#1f2937', 
        color: '#f9fafb',
        padding: '20px', 
        borderRadius: '8px', 
        marginTop: '32px',
        border: '1px solid #374151'
      }}>
        <h3 style={{ color: '#f9fafb', marginTop: 0, marginBottom: '16px' }}>
          🌙 暗色主题演示
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '20px' }}>
          {/* 暗色主题下拉选择模式 */}
          <div>
            <h4 style={{ color: '#f9fafb', marginBottom: '12px' }}>
              ✨ 下拉选择模式
            </h4>
            <div className={`ai-model-manager ${getCustomClassName()}`}>
              <AIModelSelect
                mode="select"
                theme="dark"
                selectedModelId={selectedModelId}
                onModelChange={handleModelChange}
                onConfigChange={handleConfigChange}
                storage={storageConfig}
                supportedProviders={[
                  AIProvider.OPENAI,
                  AIProvider.DEEPSEEK,
                  AIProvider.ANTHROPIC,
                  AIProvider.GOOGLE,
                  AIProvider.VOLCENGINE
                ]}
                placeholder="选择一个AI模型..."
                customClassName={getCustomClassName()}
              />
            </div>
          </div>

          {/* 暗色主题列表模式 */}
          <div>
            <h4 style={{ color: '#f9fafb', marginBottom: '12px' }}>
              ✨ 列表模式
            </h4>
            <div className={`ai-model-manager hover-scale animated ${getCustomClassName()}`}>
              <AIModelSelect
                mode="list"
                theme="dark"
                selectedModelId={selectedModelId}
                onModelChange={handleModelChange}
                onConfigChange={handleConfigChange}
                storage={storageConfig}
                supportedProviders={[
                  AIProvider.OPENAI,
                  AIProvider.OPENAILIKE,
                  AIProvider.DEEPSEEK,
                  AIProvider.ANTHROPIC,
                  AIProvider.GOOGLE,
                  AIProvider.OLLAMA,
                  AIProvider.MISTRAL,
                  AIProvider.VOLCENGINE
                ]}
                addButtonText="➕ 添加AI模型"
                allowDelete={true}
                customClassName={getCustomClassName()}
              />
            </div>
          </div>

        </div>
        
        <div style={{ marginTop: '16px', padding: '12px', background: '#111827', borderRadius: '6px', fontSize: '13px' }}>
          <p style={{ margin: '0 0 8px 0', color: '#9ca3af' }}>
            <strong>✨ 暗色主题特性：</strong>
          </p>
          <ul style={{ margin: 0, paddingLeft: '16px', color: '#9ca3af' }}>
            <li>优化的暗色系配色方案，提供更好的夜间使用体验</li>
            <li>支持三种主题模式：light、dark、system(自动适应)</li>
            <li>右侧列表启用了缩放悬停效果和基础动画</li>
          </ul>
        </div>
      </div>

      {/* 使用说明 */}
      <div style={{ 
        background: '#fef3c7', 
        padding: '20px', 
        borderRadius: '8px', 
        marginTop: '32px',
        border: '1px solid #fbbf24'
      }}>
        <h3 style={{ color: '#92400e', marginTop: 0, marginBottom: '16px' }}>
          💡 使用提示
        </h3>
        <ul style={{ color: '#92400e', paddingLeft: '20px', margin: 0 }}>
          <li><strong>下拉选择模式</strong>：类似 HTML select，适合紧凑的界面布局</li>
          <li><strong>列表模式</strong>：显示详细信息，适合需要显示模型状态和操作的场景</li>
          <li><strong>数据同步</strong>：两种模式使用相同的存储配置，数据完全同步</li>
          <li>点击"添加AI模型"或"⚙️"按钮可以打开配置弹窗</li>
          <li>在弹窗中选择不同的AI提供商会显示不同的配置选项</li>
          <li>在列表模式中点击模型右侧的"⋮"按钮可以进行编辑、启用/禁用、删除操作</li>
          <li>所有配置会根据选择的存储方式进行保存</li>
          <li>组件支持自定义样式覆盖（通过CSS变量或className）</li>
          <li><strong>基础动画效果</strong>：控制基本的悬停动画（列表项上移、按钮缩放等）</li>
          <li><strong>悬停效果</strong>：在基础动画之上，添加特定的悬停风格（缩放、滑动、发光、淡入淡出）</li>
        </ul>
      </div>


      </div>

      {/* AI模型配置管理器 - 在根级别渲染 */}
      <AIModelManager
        visible={showManager}
        theme={themeMode}
        onClose={() => setShowManager(false)}
        onConfigChange={handleConfigChange}
        storage={storageConfig}
        supportedProviders={[
          AIProvider.OPENAI,
          AIProvider.DEEPSEEK,
          AIProvider.ANTHROPIC,
          AIProvider.GOOGLE,
          AIProvider.OLLAMA,
          AIProvider.MISTRAL,
          AIProvider.VOLCENGINE
        ]}
        customClassName={getCustomClassName()}
      />
    </>
  );
};

export default DemoApp;