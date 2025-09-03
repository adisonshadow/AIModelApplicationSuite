# AI Model Manager 使用说明文档

这个目录包含了 React AI Model Manager 组件的各种示例应用和详细的使用说明。

## 示例应用列表

### AIModelSelector

AI模型选择器的完整演示应用，展示了组件的各种功能和用法。

**特性：**
- 🌖 亮色主题演示
- 🌙 暗色主题演示
- 📱 下拉选择模式
- 📋 列表模式
- 🎨 自定义样式配置
- 💾 多种存储方式（LocalStorage、API模拟）
- ⚙️ AI模型配置管理
- 🔄 选中状态持久化
- 📡 事件驱动架构

**运行方式：**
```bash
cd AIModelSelector
npm install
npm run dev
```

## 包使用说明

### 1. 基本安装和导入

```bash
npm install @ai-model-manager
```

```typescript
import { AIModelSelect, aiModelSelected } from '@ai-model-manager';
import type { AIModelConfig, AIProvider } from '@ai-model-manager/types';
```

### 2. 基本使用示例

#### 简单的下拉选择器
```typescript
import React, { useState } from 'react';
import { AIModelSelect } from '@ai-model-manager';

function SimpleExample() {
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  return (
    <AIModelSelect
      mode="select"
      selectedModelId={selectedModelId}
      onModelChange={setSelectedModelId}
      placeholder="请选择AI模型"
    />
  );
}
```

#### 列表模式选择器
```typescript
import React, { useState } from 'react';
import { AIModelSelect } from '@ai-model-manager';

function ListExample() {
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  return (
    <AIModelSelect
      mode="list"
      selectedModelId={selectedModelId}
      onModelChange={setSelectedModelId}
      showAddButton={true}
      addButtonText="添加新模型"
      allowDelete={true}
    />
  );
}
```

### 3. 使用 aiModelSelected 管理器

#### 基本使用
```typescript
import React, { useState, useEffect } from 'react';
import { AIModelSelect, aiModelSelected } from '@ai-model-manager';
import type { AIModelConfig } from '@ai-model-manager/types';

function ManagerExample() {
  const [selectedModel, setSelectedModel] = useState<AIModelConfig | null>(null);

  useEffect(() => {
    // 监听选择变化（第一次加载也会触发）
    const unsubscribe = aiModelSelected.onChange((config) => {
      setSelectedModel(config);
      console.log('模型选择变化:', config);
    });

    // 初始化管理器
    aiModelSelected.initialize();

    return unsubscribe;
  }, []);

  return (
    <div>
      <AIModelSelect
        mode="select"
        placeholder="请选择AI模型"
      />
      
      {selectedModel && (
        <div>
          <h3>当前选中的模型:</h3>
          <p>名称: {selectedModel.name}</p>
          <p>提供商: {selectedModel.provider}</p>
        </div>
      )}
    </div>
  );
}
```

#### 主动查询方法
```typescript
import React from 'react';
import { aiModelSelected } from '@ai-model-manager';

function QueryExample() {
  const handleQuery = () => {
    // 获取当前选中的模型配置
    const currentModel = aiModelSelected.getSelectedModel();
    
    // 获取当前选中的模型ID
    const currentModelId = aiModelSelected.getSelectedModelId();
    
    // 获取所有配置
    const allConfigs = aiModelSelected.getConfigs();
    
    console.log('当前选中的模型:', currentModel);
    console.log('当前选中的模型ID:', currentModelId);
    console.log('所有配置:', allConfigs);
  };

  return (
    <button onClick={handleQuery}>
      查询当前状态
    </button>
  );
}
```

### 4. 高级配置

#### 自定义存储方式
```typescript
import React from 'react';
import { AIModelSelect, createAIModelManager } from '@ai-model-manager';
import type { StorageConfig } from '@ai-model-manager/types';

function CustomStorageExample() {
  // 创建自定义管理器实例
  const customManager = createAIModelManager({
    type: 'localStorage',
    localStorageKey: 'my-custom-configs'
  });

  useEffect(() => {
    // 监听配置列表变化
    const unsubscribe = customManager.onConfigsChange((configs) => {
      console.log('配置列表变化:', configs);
    });

    customManager.initialize();
    return unsubscribe;
  }, []);

  return (
    <AIModelSelect
      mode="list"
      manager={customManager}
      showAddButton={true}
      addButtonText="添加新模型"
    />
  );
}
```

#### API存储方式
```typescript
import React from 'react';
import { AIModelSelect, createAIModelManager } from '@ai-model-manager';
import type { StorageConfig } from '@ai-model-manager/types';

function APIStorageExample() {
  const apiStorageConfig: StorageConfig = {
    type: 'api',
    api: {
      getConfigs: () => fetch('/api/configs').then(r => r.json()),
      saveConfig: (config) => fetch('/api/configs', { 
        method: 'POST', 
        body: JSON.stringify(config) 
      }),
      deleteConfig: (id) => fetch(`/api/configs/${id}`, { 
        method: 'DELETE' 
      })
    }
  };

  const apiManager = createAIModelManager(apiStorageConfig);

  return (
    <AIModelSelect
      mode="select"
      manager={apiManager}
      placeholder="从API加载的模型"
    />
  );
}
```

#### 自定义提供商
```typescript
import React from 'react';
import { AIModelSelect } from '@ai-model-manager';
import type { AIProviderMeta } from '@ai-model-manager/types';

function CustomProviderExample() {
  const customProviders: AIProviderMeta[] = [
    {
      id: 'custom-provider',
      name: '自定义提供商',
      description: '这是一个自定义的AI提供商',
      requiresApiKey: true,
      defaultBaseURL: 'https://api.custom.com',
      configFields: [
        {
          key: 'apiKey',
          label: 'API密钥',
          type: 'password',
          required: true,
          placeholder: '请输入API密钥'
        },
        {
          key: 'model',
          label: '模型名称',
          type: 'text',
          required: true,
          placeholder: '请输入模型名称'
        }
      ]
    }
  ];

  return (
    <AIModelSelect
      mode="list"
      customProviders={customProviders}
      showAddButton={true}
      addButtonText="添加自定义模型"
    />
  );
}
```

### 5. 主题和样式配置

#### 主题模式
```typescript
import React from 'react';
import { AIModelSelect } from '@ai-model-manager';

function ThemeExample() {
  return (
    <div>
      {/* 亮色主题 */}
      <AIModelSelect
        mode="select"
        theme="light"
        placeholder="亮色主题"
      />
      
      {/* 暗色主题 */}
      <AIModelSelect
        mode="list"
        theme="dark"
        placeholder="暗色主题"
      />
      
      {/* 系统自动 */}
      <AIModelSelect
        mode="select"
        theme="system"
        placeholder="系统自动"
      />
    </div>
  );
}
```

#### 自定义样式
```typescript
import React from 'react';
import { AIModelSelect } from '@ai-model-manager';

function CustomStyleExample() {
  return (
    <AIModelSelect
      mode="list"
      className="my-custom-class"
      customClassName="color-blue size-large rounded-lg"
      style={{
        minWidth: '300px',
        border: '2px solid #e2e8f0'
      }}
      primaryColorStyles={{
        primary: '#8b5cf6',
        primaryHover: '#7c3aed',
        primaryLight: 'rgba(139, 92, 246, 0.1)',
        primaryGlow: 'rgba(139, 92, 246, 0.3)'
      }}
    />
  );
}
```

### 6. 完整应用示例

```typescript
import React, { useState, useEffect } from 'react';
import { AIModelSelect, aiModelSelected } from '@ai-model-manager';
import type { AIModelConfig, AIProvider } from '@ai-model-manager/types';

function CompleteExample() {
  const [selectedModel, setSelectedModel] = useState<AIModelConfig | null>(null);
  const [configs, setConfigs] = useState<AIModelConfig[]>([]);

  useEffect(() => {
    // 监听选择变化
    const unsubscribeChange = aiModelSelected.onChange((config) => {
      setSelectedModel(config);
    });

    // 监听配置列表变化
    const unsubscribeConfigs = aiModelSelected.onConfigsChange((newConfigs) => {
      setConfigs(newConfigs);
    });

    // 初始化管理器
    aiModelSelected.initialize();

    return () => {
      unsubscribeChange();
      unsubscribeConfigs();
    };
  }, []);

  const handleAddModel = () => {
    // 可以通过点击添加按钮或编程方式添加模型
    console.log('添加新模型');
  };

  const handleQueryStatus = () => {
    const currentModel = aiModelSelected.getSelectedModel();
    const currentModelId = aiModelSelected.getSelectedModelId();
    const allConfigs = aiModelSelected.getConfigs();
    
    alert(`
      当前选中的模型: ${currentModel?.name || '无'}
      模型ID: ${currentModelId || '无'}
      配置总数: ${allConfigs.length}
    `);
  };

  return (
    <div className="app">
      <header>
        <h1>AI模型管理器示例</h1>
        <button onClick={handleQueryStatus}>查询状态</button>
      </header>

      <main>
        <section>
          <h2>下拉选择模式</h2>
          <AIModelSelect
            mode="select"
            theme="light"
            placeholder="请选择AI模型"
            supportedProviders={[
              AIProvider.OPENAI,
              AIProvider.DEEPSEEK,
              AIProvider.ANTHROPIC
            ]}
          />
        </section>

        <section>
          <h2>列表模式</h2>
          <AIModelSelect
            mode="list"
            theme="dark"
            showAddButton={true}
            addButtonText="添加新模型"
            allowDelete={true}
            supportedProviders={[
              AIProvider.OPENAI,
              AIProvider.DEEPSEEK,
              AIProvider.ANTHROPIC,
              AIProvider.GOOGLE,
              AIProvider.VOLCENGINE
            ]}
          />
        </section>

        <section>
          <h2>当前状态</h2>
          <div>
            <p><strong>选中的模型:</strong> {selectedModel?.name || '无'}</p>
            <p><strong>提供商:</strong> {selectedModel?.provider || '无'}</p>
            <p><strong>配置总数:</strong> {configs.length}</p>
            <p><strong>启用的配置:</strong> {configs.filter(c => c.enabled).length}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
```

### 7. API 参考

#### AIModelSelect Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mode` | `'select' \| 'list'` | `'select'` | 显示模式 |
| `selectedModelId` | `string` | `undefined` | 当前选中的模型ID |
| `onModelChange` | `(modelId: string) => void` | `undefined` | 模型选择变化回调 |
| `onConfigChange` | `(configs: AIModelConfig[]) => void` | `undefined` | 配置列表变化回调 |
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | 主题模式 |
| `className` | `string` | `''` | 自定义CSS类名 |
| `customClassName` | `string` | `''` | 自定义样式类名 |
| `style` | `React.CSSProperties` | `undefined` | 内联样式 |
| `storage` | `StorageConfig` | `undefined` | 存储配置 |
| `supportedProviders` | `AIProvider[]` | `[OPENAI, DEEPSEEK, ...]` | 支持的提供商 |
| `customProviders` | `AIProviderMeta[]` | `[]` | 自定义提供商 |
| `showAddButton` | `boolean` | `true` | 是否显示添加按钮 |
| `addButtonText` | `string` | `'添加AI模型'` | 添加按钮文本 |
| `allowDelete` | `boolean` | `true` | 是否允许删除 |
| `placeholder` | `string` | `'请选择AI模型'` | 占位符文本 |
| `manager` | `AIModelManager` | `undefined` | 管理器实例 |

#### aiModelSelected 方法

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `onChange(callback)` | `(config: AIModelConfig \| null) => void` | `() => void` | 监听选择变化 |
| `onConfigsChange(callback)` | `(configs: AIModelConfig[]) => void` | `() => void` | 监听配置列表变化 |
| `getSelectedModel()` | 无 | `AIModelConfig \| null` | 获取当前选中的模型 |
| `getSelectedModelId()` | 无 | `string \| null` | 获取当前选中的模型ID |
| `getConfigs()` | 无 | `AIModelConfig[]` | 获取所有配置 |
| `getConfigById(id)` | `string` | `AIModelConfig \| null` | 根据ID获取配置 |
| `setSelectedModel(modelId)` | `string \| null` | `Promise<void>` | 设置选中的模型 |
| `saveConfig(config)` | `AIModelConfig` | `Promise<AIModelConfig>` | 保存配置 |
| `deleteConfig(id)` | `string` | `Promise<void>` | 删除配置 |
| `updateConfig(id, updates)` | `string, Partial<AIModelConfig>` | `Promise<AIModelConfig>` | 更新配置 |
| `initialize()` | 无 | `Promise<void>` | 初始化管理器 |
| `destroy()` | 无 | `void` | 销毁管理器 |

### 8. 注意事项

1. **选中状态持久化**: 选中状态会自动保存到 localStorage，key 为 `{localStorageKey}-selected`
2. **管理器实例**: 管理器实例是单例的，多个组件可以共享同一个实例
3. **内存泄漏**: 记得在组件卸载时取消订阅回调，避免内存泄漏
4. **初始化**: 使用前需要调用 `initialize()` 方法
5. **命名规范**: 使用小写字母开头的命名，避免与React组件冲突
6. **存储方式**: 支持localStorage、API、自定义存储方式
7. **事件驱动**: 基于事件回调的设计，支持多个组件共享同一个管理器实例

## 添加新的示例

要添加新的示例应用：

1. 在 `examples` 目录下创建新的子目录
2. 包含完整的应用代码和配置文件
3. 更新此 README 文件，添加新示例的说明
4. 确保示例应用能够正确引用主库的组件

## 注意事项

- 每个示例应用都是独立的，有自己的依赖管理
- 示例应用通过相对路径引用主库的组件和类型
- 构建输出统一到 `examples-dist` 目录
