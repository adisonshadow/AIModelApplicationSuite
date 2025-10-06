import React, { useState, useCallback, useEffect } from "react";
import {
  AIModelSelect,
  AIModelManagerComponent,
  getGlobalAIModelManager,
} from "../../packages/ai_model_application_suite/src";
import {
  AIModelConfig,
  AIProvider,
  StorageConfig,
  ThemeMode,
} from "../../packages/ai_model_application_suite/src";

// 模拟API调用的演示
const mockAPI = {
  async getConfigs(): Promise<AIModelConfig[]> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    const stored = localStorage.getItem("demo-api-configs");
    if (stored) {
      return JSON.parse(stored).map((config: any) => ({
        ...config,
        createdAt: new Date(config.createdAt),
        updatedAt: new Date(config.updatedAt),
      }));
    }

    return [
      {
        id: "demo-1",
        name: "GPT-4 Demo",
        provider: AIProvider.OPENAI,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {
          apiKey: "sk-demo-key-hidden",
          baseURL: "https://api.openai.com/v1",
          model: "gpt-4",
        },
      },
    ];
  },

  async saveConfig(config: AIModelConfig): Promise<AIModelConfig> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const stored = localStorage.getItem("demo-api-configs");
    const configs = stored ? JSON.parse(stored) : [];

    const existingIndex = configs.findIndex((c: any) => c.id === config.id);
    const serializedConfig = {
      ...config,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };

    if (existingIndex >= 0) {
      configs[existingIndex] = serializedConfig;
    } else {
      configs.push(serializedConfig);
    }

    localStorage.setItem("demo-api-configs", JSON.stringify(configs));
    return config;
  },

  async deleteConfig(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const stored = localStorage.getItem("demo-api-configs");
    if (stored) {
      const configs = JSON.parse(stored);
      const filtered = configs.filter((c: any) => c.id !== id);
      localStorage.setItem("demo-api-configs", JSON.stringify(filtered));
    }
  },

  async updateConfig(
    id: string,
    updates: Partial<AIModelConfig>
  ): Promise<AIModelConfig> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const stored = localStorage.getItem("demo-api-configs");
    const configs = stored ? JSON.parse(stored) : [];

    const existingIndex = configs.findIndex((c: any) => c.id === id);
    if (existingIndex >= 0) {
      const config = {
        ...configs[existingIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      configs[existingIndex] = config;
      localStorage.setItem("demo-api-configs", JSON.stringify(configs));

      return {
        ...config,
        createdAt: new Date(config.createdAt),
        updatedAt: new Date(config.updatedAt),
      };
    }

    throw new Error(`Config with id ${id} not found`);
  },
};

const providerList = [
    AIProvider.OPENAI,
    AIProvider.OPENAILIKE,
    AIProvider.DEEPSEEK,
    AIProvider.VOLCENGINE,
    AIProvider.ALIYUN_BAILIAN,
    AIProvider.GOOGLE,
    AIProvider.OLLAMA,
    // AIProvider.ANTHROPIC
];

const DemoApp: React.FC = () => {
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [configs, setConfigs] = useState<AIModelConfig[]>([]);
  const [storageType, setStorageType] = useState<"localStorage" | "api">(
    "localStorage"
  );
  const [customStyle, setCustomStyle] = useState(false);
  const [showManager, setShowManager] = useState(false);

  // 添加 globalAIModelManager 监听
  useEffect(() => {
    // 使用正确的存储配置重新获取管理器实例
    const manager = getGlobalAIModelManager(storageConfig);
    
    // 初始化管理器
    manager.initialize();
    
    // 监听选择变化
    const unsubscribe = manager.subscribe('modelSelected', (event: any) => {
      if (event.data?.config) {
        setSelectedModelId(event.data.config.id);
        console.log("globalAIModelManager 选择变化:", event.data.config);
      }
    });

    // 监听配置列表变化
    const unsubscribeConfigs = manager.subscribe('configsLoaded', (event: any) => {
      setConfigs(event.data || []);
      console.log("globalAIModelManager 配置变化:", event.data);
    });

    // 获取初始状态
    setSelectedModelId(manager.getCurrentModelId() || '');
    setConfigs(manager.getConfigs());

    return () => {
      unsubscribe();
      unsubscribeConfigs();
    };
  }, []);

  // 新增的样式配置选项
  const [themeMode, setThemeMode] = useState<ThemeMode>("light"); // 主题模式
  const [primaryColor, setPrimaryColor] = useState<string>("blue");
  const [size, setSize] = useState<string>("normal");
  const [borderRadius, setBorderRadius] = useState<string>("default");
  const [shadow, setShadow] = useState<string>("default");
  const [animation, setAnimation] = useState<boolean>(false);
  const [gradient, setGradient] = useState<boolean>(false);
  const [hoverEffect, setHoverEffect] = useState<string>("none");
  // const [width, setWidth] = useState<string>('auto'); // 暂时注释掉

  // 存储配置
  const storageConfig: StorageConfig =
    storageType === "api"
      ? {
          type: "api",
          api: mockAPI,
        }
      : {
          type: "localStorage",
          localStorageKey: "ai-model-configs",
        };

  const handleModelChange = useCallback((modelId: string) => {
    console.log("选中的模型ID:", modelId);
    setSelectedModelId(modelId);
    // 同时更新 globalAIModelManager
    const manager = getGlobalAIModelManager(storageConfig);
    manager.setCurrentModel(modelId);
  }, [storageConfig]);

  const handleConfigChange = useCallback((newConfigs: AIModelConfig[]) => {
    console.log("配置更新:", newConfigs);
    setConfigs(newConfigs);
  }, []);


  // 生成自定义样式类名 - 使用扩展样式
  const getCustomClassName = useCallback(() => {
    const classes: string[] = [];

    if (customStyle) {
      classes.push("unbuild-selector");
    }

    // 始终添加主色调类，包括默认的蓝色
    classes.push(`color-${primaryColor}`);

    if (size !== "normal") {
      classes.push(`size-${size}`);
    }

    if (borderRadius !== "default") {
      classes.push(`rounded-${borderRadius}`);
    }

    if (shadow !== "default") {
      classes.push(`shadow-${shadow}`);
    }

    if (animation) {
      classes.push("animated");
    }

    if (gradient) {
      classes.push("gradient-bg");
    }

    if (hoverEffect !== "none") {
      classes.push(`hover-${hoverEffect}`);
    }

    return classes.join(" ");
  }, [
    customStyle,
    primaryColor,
    size,
    borderRadius,
    shadow,
    animation,
    gradient,
    hoverEffect,
  ]);

  // 生成主色调相关的样式对象
  const getPrimaryColorStyles = useCallback(() => {
    const colorMap = {
      blue: {
        primary: "#3b82f6",
        primaryHover: "#2563eb",
        primaryLight: "rgba(59, 130, 246, 0.1)",
        primaryGlow: "rgba(59, 130, 246, 0.3)",
      },
      purple: {
        primary: "#8b5cf6",
        primaryHover: "#7c3aed",
        primaryLight: "rgba(139, 92, 246, 0.1)",
        primaryGlow: "rgba(139, 92, 246, 0.3)",
      },
      green: {
        primary: "#10b981",
        primaryHover: "#059669",
        primaryLight: "rgba(16, 185, 129, 0.1)",
        primaryGlow: "rgba(16, 185, 129, 0.3)",
      },
      orange: {
        primary: "#f59e0b",
        primaryHover: "#d97706",
        primaryLight: "rgba(245, 158, 11, 0.1)",
        primaryGlow: "rgba(245, 158, 11, 0.3)",
      },
      red: {
        primary: "#ef4444",
        primaryHover: "#dc2626",
        primaryLight: "rgba(239, 68, 68, 0.1)",
        primaryGlow: "rgba(239, 68, 68, 0.3)",
      },
    };

    return colorMap[primaryColor as keyof typeof colorMap] || colorMap.blue;
  }, [primaryColor]);

  // 扩展样式注入器 - 支持多种颜色主题和样式效果
  useEffect(() => {
    if (!customStyle) return;

    const styles = getPrimaryColorStyles();
    const styleId = "unbuild-selector-extended-styles";

    // 移除旧的样式
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    // 创建新的样式元素
    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = `
      /* UnbuildSelector 扩展样式 - 多种颜色主题 */
      
      /* 主色调样式 */
      .ai-model-item.selected {
        background-color: ${styles.primaryLight} !important;
        border-left: 3px solid ${styles.primary} !important;
      }
      
      .ai-model-add-button {
        background-color: var(--bg-secondary) !important;
        color: var(--text-secondary) !important;
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
        background: linear-gradient(135deg, ${styles.primaryLight},rgba(248, 250, 252, 0.17)) !important;
      }
      
      /* 扩展颜色主题样式 */
      .unbuild-selector.color-blue {
        --primary-color: #3b82f6;
        --primary-hover: #2563eb;
        --primary-light: rgba(59, 130, 246, 0.1);
        --primary-glow: rgba(59, 130, 246, 0.3);
        --bg-secondary: #f5fbff0d;
      }
      
      .unbuild-selector.color-purple {
        --primary-color: #8b5cf6;
        --primary-hover: #7c3aed;
        --primary-light: rgba(139, 92, 246, 0.1);
        --primary-glow: rgba(139, 92, 246, 0.3);
        --bg-secondary: #f5fbff0d;
      }
      
      .unbuild-selector.color-green {
        --primary-color: #10b981;
        --primary-hover: #059669;
        --primary-light: rgba(16, 185, 129, 0.1);
        --primary-glow: rgba(16, 185, 129, 0.3);
        --bg-secondary: #f5fbff0d;
      }
      
      .unbuild-selector.color-orange {
        --primary-color: #f59e0b;
        --primary-hover: #d97706;
        --primary-light: rgba(245, 158, 11, 0.1);
        --primary-glow: rgba(245, 158, 11, 0.3);
        --bg-secondary: #f5fbff0d;
      }
      
      .unbuild-selector.color-red {
        --primary-color: #ef4444;
        --primary-hover: #dc2626;
        --primary-light: rgba(239, 68, 68, 0.1);
        --primary-glow: rgba(239, 68, 68, 0.3);
        --bg-secondary: #f5fbff0d;
      }
      
      /* 扩展尺寸样式 */
      .unbuild-selector.size-compact {
        font-size: 12px;
      }
      
      .unbuild-selector.size-compact .ai-model-item {
        padding: 8px 12px;
      }
      
      .unbuild-selector.size-compact .ai-model-name {
        font-size: 12px;
      }
      
      .unbuild-selector.size-compact .ai-model-provider {
        font-size: 10px;
      }
      
      .unbuild-selector.size-compact .ai-button {
        padding: 4px 8px;
        font-size: 11px;
      }
      
      .unbuild-selector.size-large {
        font-size: 16px;
      }
      
      .unbuild-selector.size-large .ai-model-item {
        padding: 16px 20px;
      }
      
      .unbuild-selector.size-large .ai-model-name {
        font-size: 16px;
      }
      
      .unbuild-selector.size-large .ai-model-provider {
        font-size: 14px;
      }
      
      .unbuild-selector.size-large .ai-button {
        padding: 10px 16px;
        font-size: 14px;
      }
      
      /* 扩展圆角样式 */
      .unbuild-selector.rounded-none {
        --border-radius: 0px;
      }
      
      .unbuild-selector.rounded-sm {
        --border-radius: 2px;
      }
      
      .unbuild-selector.rounded-lg {
        --border-radius: 12px;
      }
      
      .unbuild-selector.rounded-xl {
        --border-radius: 16px;
      }
      
      .unbuild-selector.rounded-full {
        --border-radius: 9999px;
      }
      
      /* 扩展阴影样式 */
      .unbuild-selector.shadow-none {
        --shadow-sm: none;
        --shadow-md: none;
        --shadow-lg: none;
      }
      
      .unbuild-selector.shadow-inner {
        --shadow-sm: inset 0 2px 4px 0 rgb(0 0 0 / 0.06);
        --shadow-md: inset 0 4px 6px -1px rgb(0 0 0 / 0.1);
        --shadow-lg: inset 0 10px 15px -3px rgb(0 0 0 / 0.1);
      }
      
      .unbuild-selector.shadow-outline {
        --shadow-sm: 0 0 0 3px rgb(59 130 246 / 0.1);
        --shadow-md: 0 0 0 3px rgb(59 130 246 / 0.2);
        --shadow-lg: 0 0 0 3px rgb(59 130 246 / 0.3);
      }
      
      /* 扩展动画效果 */
      .unbuild-selector.animated .ai-model-item {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .unbuild-selector.animated .ai-model-item:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }
      
      .unbuild-selector.animated .ai-button {
        transition: all 0.2s ease;
      }
      
      .unbuild-selector.animated .ai-button:hover {
        transform: scale(1.05);
      }
      
      /* 扩展悬停效果 */
      .unbuild-selector.hover-scale .ai-model-item:hover {
        transform: scale(1.02);
        transition: transform 0.2s ease;
      }
      
      .unbuild-selector.hover-slide .ai-model-item:hover {
        transform: translateX(4px);
        transition: transform 0.2s ease;
        border-left-color: var(--primary-color);
      }
      
      .unbuild-selector.hover-glow .ai-model-item:hover {
        box-shadow: 0 0 20px var(--primary-glow);
        transition: box-shadow 0.3s ease;
      }
      
      .unbuild-selector.hover-fade .ai-model-item {
        opacity: 0.8;
        transition: opacity 0.2s ease;
      }
      
      .unbuild-selector.hover-fade .ai-model-item:hover {
        opacity: 1;
      }
      
      /* 扩展渐变背景 */
      .unbuild-selector.gradient-bg .ai-model-item:hover {
        background: linear-gradient(135deg, var(--bg-secondary), var(--bg-color));
      }
      
      .unbuild-selector.gradient-bg .ai-model-item.selected {
        background: linear-gradient(135deg, var(--primary-light), var(--bg-secondary));
      }
      
      /* 扩展边框样式 */
      .unbuild-selector.border-dashed {
        border-style: dashed;
      }
      
      .unbuild-selector.border-dashed .ai-model-item {
        border-style: dashed;
      }
      
      .unbuild-selector.border-thick {
        border-width: 2px;
      }
      
      .unbuild-selector.border-thick .ai-model-item {
        border-width: 2px;
      }
      
      /* 暗色主题下的特殊处理 */
      .ai-model-manager.theme-dark .ai-model-add-button {
        background-color: var(--bg-secondary) !important;
        color: var(--text-secondary) !important;
      }
      
      .ai-model-manager.theme-dark .ai-model-add-button:hover {
        background-color: var(--primary-light) !important;
        color: var(--primary-color) !important;
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
      <div
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px",
        }}
      >

        {/* 配置选项 */}
        <div
          style={{
            background: "#f8fafc",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "32px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3 style={{ color: "#1e293b", marginTop: 0, marginBottom: "16px" }}>
            Demo Configuration
          </h3>

          <div
            style={{
              display: "flex",
              gap: "24px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <label
                style={{
                  color: "#374151",
                  fontWeight: 500,
                  marginRight: "8px",
                }}
              >
                Storage Type:
              </label>
              <select
                value={storageType}
                onChange={(e) =>
                  setStorageType(e.target.value as "localStorage" | "api")
                }
                style={{
                  padding: "6px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                }}
              >
                <option value="localStorage">LocalStorage</option>
                <option value="api">API</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="customStyle"
                checked={customStyle}
                onChange={(e) => setCustomStyle(e.target.checked)}
              />
              <label
                htmlFor="customStyle"
                style={{ color: "#374151", fontWeight: 500 }}
              >
                Enable Custom Styles
              </label>
            </div>

            {/* 管理按钮 */}
            <div
              style={{
                marginLeft: "16px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <button
                style={{
                  padding: "8px 16px",
                  background: "#6366f1",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
                onClick={() => {
                  console.log("点击了管理按钮，设置 showManager 为 true");
                  setShowManager(true);
                }}
              >
                ⚒️ AI Model Configuration
              </button>
              {showManager && (
                <span
                  style={{
                    marginLeft: "8px",
                    color: "#059669",
                    fontSize: "12px",
                  }}
                >
                  (Manager is opened)
                </span>
              )}
            </div>
          </div>

          {/* 自定义样式控制面板 */}
          {customStyle && (
            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                background: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h4
                style={{
                  margin: "0 0 12px 0",
                  color: "#374151",
                  fontSize: "14px",
                }}
              >
                🎨 Style Customization Options
              </h4>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "12px",
                }}
              >
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
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Brand Color
                  </label>
                  <select
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      fontSize: "12px",
                      borderRadius: "4px",
                    }}
                  >
                    <option value="blue">🔵 Blue</option>
                    <option value="purple">🟣 Purple</option>
                    <option value="green">🟢 Green</option>
                    <option value="orange">🟠 Orange</option>
                    <option value="red">🔴 Red</option>
                  </select>
                </div>

                {/* 尺寸选择 */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Size
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      fontSize: "12px",
                      borderRadius: "4px",
                    }}
                  >
                    <option value="compact">🔍 Compact</option>
                    <option value="normal">📱 Normal</option>
                    <option value="large">💻 Large</option>
                  </select>
                </div>

                {/* 圆角选择 */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Corner Radius
                  </label>
                  <select
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      fontSize: "12px",
                      borderRadius: "4px",
                    }}
                  >
                    <option value="none">◼️ None</option>
                    <option value="sm">🔹 Small</option>
                    <option value="default">🔸 Default</option>
                    <option value="lg">🔶 Large</option>
                    <option value="full">⭕ Full</option>
                  </select>
                </div>

                {/* 阴影选择 */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Shadow
                  </label>
                  <select
                    value={shadow}
                    onChange={(e) => setShadow(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      fontSize: "12px",
                      borderRadius: "4px",
                    }}
                  >
                    <option value="default">🌅 Default</option>
                    <option value="none">🌆 None</option>
                    <option value="inner">🌇 Inner</option>
                    <option value="outline">🌄 Outline</option>
                  </select>
                </div>

                {/* 悬停效果选择 */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Hover
                  </label>
                  <select
                    value={hoverEffect}
                    onChange={(e) => setHoverEffect(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      fontSize: "12px",
                      borderRadius: "4px",
                    }}
                  >
                    <option value="none">🚫 None</option>
                    <option value="scale">🔍 缩放</option>
                    <option value="slide">➡️ Slide</option>
                    <option value="glow">✨ Glow</option>
                    <option value="fade">🌫️ Fade</option>
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

              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "#374151",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={animation}
                    onChange={(e) => setAnimation(e.target.checked)}
                  />
                  ✨ Enable Basic Animation Effect (Move up, Button Scale)
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "#374151",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={gradient}
                    onChange={(e) => setGradient(e.target.checked)}
                  />
                  🌈 Enable Gradient Background
                </label>
              </div>
            </div>
          )}

          <div
            style={{ marginTop: "16px", fontSize: "14px", color: "#64748b" }}
          >
            <p>
              • <strong>LocalStorage Mode</strong>: Data is stored in the browser's local storage
            </p>
            <p>
              • <strong>API Mode</strong>:
              Simulate saving data through API (actually stored in LocalStorage, but simulated network requests)
            </p>
          </div>
        </div>

        {/* 当前状态显示 */}
        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "32px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3 style={{ color: "#1e293b", marginTop: 0, marginBottom: "16px" }}>
            Current State
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div>
              <strong style={{ color: "#374151" }}>Selected Model ID:</strong>
              <div
                style={{
                  color: "#059669",
                  fontFamily: "monospace",
                  marginTop: "4px",
                }}
              >
                {selectedModelId || "(unselected)"}
              </div>
            </div>

            <div>
              <strong style={{ color: "#374151" }}>Configuration Count:</strong>
              <div
                style={{
                  color: "#059669",
                  fontFamily: "monospace",
                  marginTop: "4px",
                }}
              >
                {configs.length} configurations
              </div>
            </div>
          </div>

          {configs.length > 0 && (
            <details style={{ marginTop: "16px" }}>
              <summary
                style={{ cursor: "pointer", color: "#6366f1", fontWeight: 500 }}
              >
                View All Configurations (JSON)
              </summary>
              <pre
                style={{
                  background: "#f8fafc",
                  padding: "12px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  overflow: "auto",
                  marginTop: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                {JSON.stringify(configs, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {/* 主要演示区域 */}
        <div
          style={{
            background: "#f1f1f1",
            color: "#111",
            padding: "20px",
            borderRadius: "8px",
            marginTop: "32px",
            border: "1px solidrgb(183, 183, 183)",
          }}
        >
          <h3 style={{ color: "#000", marginTop: 0, marginBottom: "16px" }}>
            🌖 Light Theme Demo
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              marginTop: "20px",
            }}
          >
            {/* 下拉选择模式（默认） */}
            <div>
              <h4 style={{ color: "#1e293b", marginBottom: "16px" }}>
                ✨ Dropdown Mode (Default)
              </h4>
              <div
                className={`ai-model-manager ${getCustomClassName()}`}
                onClick={() => setThemeMode("light")}
              >
                <AIModelSelect
                  mode="select"
                  theme="light"
                  selectedModelId={selectedModelId}
                  onModelChange={handleModelChange}
                  onConfigChange={handleConfigChange}
                  storage={storageConfig}
                  supportedProviders={providerList}
                  placeholder="Select an AI model..."
                  customClassName={getCustomClassName()}
                  manager={getGlobalAIModelManager(storageConfig)}
                />

                <h4 style={{ color: "#1e293b", margin: "30px 0 16px 0" }}>
                  ✨ Custom Label
                </h4>

                <AIModelSelect
                  mode="select"
                  theme="light"
                  selectedModelId={selectedModelId}
                  onModelChange={handleModelChange}
                  onConfigChange={handleConfigChange}
                  storage={storageConfig}
                  supportedProviders={providerList}
                  placeholder="Select an AI model..."
                  customClassName={getCustomClassName()}
                  manager={getGlobalAIModelManager(storageConfig)}
                  formatLabel={(config) => config.name} // 只显示配置名称
                />

                <h4 style={{ color: "#1e293b", margin: "30px 0 16px 0" }}>
                   📚 i18n
                </h4>

                <AIModelSelect
                  mode="select"
                  theme="light"
                  selectedModelId={selectedModelId}
                  onModelChange={handleModelChange}
                  onConfigChange={handleConfigChange}
                  storage={storageConfig}
                  supportedProviders={providerList}
                  locale="zh"
                  placeholder="请选择一个AI模型..."
                  customClassName={getCustomClassName()}
                  manager={getGlobalAIModelManager(storageConfig)}
                />

              </div>
            </div>

            {/* 列表模式 */}
            <div>
              <h4 style={{ color: "#1e293b", marginBottom: "16px" }}>
                ✨ List Mode
              </h4>
              <div
                className={`ai-model-manager ${getCustomClassName()}`}
                onClick={() => setThemeMode("light")}
              >
                <AIModelSelect
                  mode="list"
                  theme="light"
                  selectedModelId={selectedModelId}
                  onModelChange={handleModelChange}
                  onConfigChange={handleConfigChange}
                  storage={storageConfig}
                  supportedProviders={providerList}
                  addButtonText="➕ Add AI Model"
                  allowDelete={true}
                  style={{
                    minWidth: "100%",
                  }}
                  customClassName={getCustomClassName()}
                  manager={getGlobalAIModelManager(storageConfig)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 暗色主题演示区域 */}
        <div
          style={{
            background: "#1b1b1b",
            color: "#f9fafb",
            padding: "20px",
            borderRadius: "8px",
            marginTop: "32px",
            border: "1px solid #374151",
          }}
        >
          <h3 style={{ color: "#f9fafb", marginTop: 0, marginBottom: "16px" }}>
            🌙 Dark Theme Demo
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "32px",
              marginTop: "20px",
            }}
          >
            {/* 暗色主题下拉选择模式 */}
            <div>
              <h4 style={{ color: "#f9fafb", marginBottom: "12px" }}>
                ✨ Dropdown Mode
              </h4>
              <div
                className={`ai-model-manager ${getCustomClassName()}`}
                onClick={() => setThemeMode("dark")}
              >
                <AIModelSelect
                  mode="select"
                  theme="dark"
                  selectedModelId={selectedModelId}
                  onModelChange={handleModelChange}
                  onConfigChange={handleConfigChange}
                  storage={storageConfig}
                  supportedProviders={providerList}
                  placeholder="Select an AI model..."
                  customClassName={getCustomClassName()}
                  manager={getGlobalAIModelManager(storageConfig)}
                />
              </div>

              <h4 style={{ color: "#f9fafb", margin: "16px 0 10px 0", fontSize: "14px" }}>
                30% width
              </h4>
              <div
                className={`ai-model-manager ${getCustomClassName()}`}
                onClick={() => setThemeMode("dark")}
              >
                <AIModelSelect
                  mode="select"
                  theme="dark"
                  width="30%"
                  selectedModelId={selectedModelId}
                  onModelChange={handleModelChange}
                  onConfigChange={handleConfigChange}
                  storage={storageConfig}
                  supportedProviders={providerList}
                  placeholder="Select an AI model..."
                  customClassName={getCustomClassName()}
                  manager={getGlobalAIModelManager(storageConfig)}
                />
              </div>

              <h4 style={{ color: "#f9fafb", margin: "16px 0 10px 0", fontSize: "14px" }}>
                80px width
              </h4>
              <div
                className={`ai-model-manager ${getCustomClassName()}`}
                onClick={() => setThemeMode("dark")}
              >
                <AIModelSelect
                  mode="select"
                  theme="dark"
                  width="80px"
                  selectedModelId={selectedModelId}
                  onModelChange={handleModelChange}
                  onConfigChange={handleConfigChange}
                  storage={storageConfig}
                  supportedProviders={providerList}
                  placeholder="Select an AI model..."
                  customClassName={getCustomClassName()}
                  manager={getGlobalAIModelManager(storageConfig)}
                />
              </div>
            </div>

            {/* 暗色主题列表模式 */}
            <div>
              <h4 style={{ color: "#f9fafb", marginBottom: "12px" }}>
                ✨ List Mode
              </h4>
              <div
                className={`ai-model-manager hover-scale animated ${getCustomClassName()}`}
                onClick={() => setThemeMode("dark")}
              >
                <AIModelSelect
                  mode="list"
                  theme="dark"
                  selectedModelId={selectedModelId}
                  onModelChange={handleModelChange}
                  onConfigChange={handleConfigChange}
                  storage={storageConfig}
                  supportedProviders={providerList}
                  addButtonText="➕ Add AI Model"
                  allowDelete={true}
                  customClassName={getCustomClassName()}
                  manager={getGlobalAIModelManager(storageConfig)}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background: "#252525",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          >
            <p style={{ margin: "0 0 8px 0", color: "#9ca3af" }}>
              <strong>✨ Dark Theme Features:</strong>
            </p>
            <ul style={{ margin: 0, paddingLeft: "16px", color: "#9ca3af" }}>
              <li>Optimized dark color scheme, providing better nighttime experience</li>
              <li>Supports three theme modes: light, dark, system(automatic adaptation)</li>
              <li>Right list enabled hover effect and basic animation</li>
            </ul>
          </div>
        </div>

        {/* 使用说明 */}
        <div
          style={{
            background: "#fef3c7",
            padding: "20px",
            borderRadius: "8px",
            marginTop: "32px",
            border: "1px solid #fbbf24",
          }}
        >
          <h3 style={{ color: "#92400e", marginTop: 0, marginBottom: "16px" }}>
            💡 Usage Tips
          </h3>
          <ul style={{ color: "#92400e", paddingLeft: "20px", margin: 0 }}>
            <li>
              <strong>Dropdown Mode</strong>: Similar to HTML
              select，Suitable for compact interface layout
            </li>
            <li>
              <strong>List Mode</strong>
              : Display detailed information, suitable for scenarios that need to display model status and operations
            </li>
            <li>
              <strong>Data Synchronization</strong>
              : Both modes use the same storage configuration, data is fully synchronized
            </li>
            <li>Click "Add AI Model" or "⚙️" button can open the configuration popup</li>
            <li>Different configuration options will be displayed in the popup by selecting different AI providers</li>
            <li>
              In the list mode, click the "⋮" button on the model on the right can edit, enable/disable, delete operations
            </li>
            <li>All configurations will be saved according to the selected storage method</li>
            <li>Component supports custom style override (through CSS variables or className)</li>
            <li>
              <strong>Custom Label Formatting</strong>: Through{" "}
              <code>formatLabel</code> Property can customize the display format of options in the dropdown selector
            </li>
            <li>
              <strong>Basic Animation Effect</strong>
              : Control basic hover animation (list item move up, button scale, etc.)
            </li>
            <li>
              <strong>Hover Effect</strong>
              : On the basis of basic animation, add specific hover style (scale, slide, glow, fade)
            </li>
          </ul>
        </div>
      </div>

      {/* AI模型配置管理器 - 在根级别渲染 */}
      <AIModelManagerComponent
        visible={showManager}
        theme={themeMode}
        onClose={() => setShowManager(false)}
        onConfigChange={handleConfigChange}
        storage={storageConfig}
        supportedProviders={providerList}
        customClassName={getCustomClassName()}
      />
    </>
  );
};

export default DemoApp;
