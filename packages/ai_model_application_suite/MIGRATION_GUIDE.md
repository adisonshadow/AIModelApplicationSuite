# 迁移指南 - 从 v0.0.2 到 v0.0.3

本指南将帮助您从旧版本迁移到新版本的API。

## 🚀 主要变化

### 1. 新的全局管理器

**旧方式 (v0.0.2):**
```tsx
import { createAIModelManager } from 'ai-model-application-suite';

const manager = createAIModelManager({
  type: 'localStorage',
  localStorageKey: 'my-configs'
});

// 手动管理状态
const [configs, setConfigs] = useState([]);
const [selectedModel, setSelectedModel] = useState(null);

useEffect(() => {
  manager.initialize().then(() => {
    setConfigs(manager.getConfigs());
    setSelectedModel(manager.getSelectedModel());
  });
}, []);
```

**新方式 (v0.0.3 推荐):**
```tsx
import { useAIModel } from 'ai-model-application-suite';

function MyComponent() {
  const { 
    currentModel, 
    configs, 
    setCurrentModel, 
    addConfig 
  } = useAIModel({
    type: 'localStorage',
    localStorageKey: 'my-configs'
  });

  // 自动管理状态，无需手动初始化
  return <div>当前模型: {currentModel?.name}</div>;
}
```

### 2. 全局状态管理

**旧方式:**
```tsx
// 每个组件都需要单独管理状态
const ComponentA = () => {
  const [model, setModel] = useState(null);
  // ...
};

const ComponentB = () => {
  const [model, setModel] = useState(null);
  // ...
};
```

**新方式:**
```tsx
// 使用全局管理器，所有组件共享状态
import { globalAIModelManager } from 'ai-model-application-suite';

const ComponentA = () => {
  const { currentModel } = useAIModel();
  // 自动同步状态
};

const ComponentB = () => {
  const { currentModel } = useAIModel();
  // 自动同步状态
};
```

### 3. 事件监听

**旧方式:**
```tsx
useEffect(() => {
  const unsubscribe = manager.onChange((config) => {
    console.log('模型变化:', config);
  });
  return unsubscribe;
}, []);
```

**新方式:**
```tsx
import { useAIModel } from 'ai-model-application-suite';

function MyComponent() {
  const { subscribe } = useAIModel();
  
  useEffect(() => {
    const unsubscribe = subscribe('modelSelected', (event) => {
      console.log('模型变化:', event.data);
    });
    return unsubscribe;
  }, [subscribe]);
}
```

### 4. AI事件管理

**新增功能:**
```tsx
import { useAIEvents } from 'ai-model-application-suite';

function ChatComponent() {
  const { 
    startConversation, 
    stopConversation, 
    sendMessage,
    startStream,
    stopStream 
  } = useAIEvents();

  const handleStartChat = () => {
    startConversation();
    sendMessage('你好');
  };

  const handleStopChat = () => {
    stopConversation();
  };
}
```

## 📋 迁移步骤

### 步骤 1: 更新导入

**旧导入:**
```tsx
import { 
  AIModelSelect, 
  createAIModelManager,
  aiModelSelected 
} from 'ai-model-application-suite';
```

**新导入:**
```tsx
import { 
  AIModelSelect,
  useAIModel,
  useAIEvents,
  globalAIModelManager,
  aiEventManager
} from 'ai-model-application-suite';
```

### 步骤 2: 替换管理器使用

**旧方式:**
```tsx
const manager = createAIModelManager(storage);
await manager.initialize();
const configs = manager.getConfigs();
const selectedModel = manager.getSelectedModel();
```

**新方式:**
```tsx
// 使用Hook (推荐)
const { configs, currentModel } = useAIModel(storage);

// 或使用全局管理器
const manager = globalAIModelManager;
await manager.initialize();
const configs = manager.getConfigs();
const selectedModel = manager.getCurrentModel();
```

### 步骤 3: 更新事件监听

**旧方式:**
```tsx
const unsubscribe = manager.onChange((config) => {
  // 处理变化
});
```

**新方式:**
```tsx
const { subscribe } = useAIModel();
const unsubscribe = subscribe('modelSelected', (event) => {
  // 处理变化
});
```

### 步骤 4: 添加AI事件管理

**新增:**
```tsx
import { useAIEvents } from 'ai-model-application-suite';

function MyComponent() {
  const { 
    startConversation, 
    stopConversation,
    currentConversation 
  } = useAIEvents();

  // 管理对话状态
}
```

## ⚠️ 弃用警告

以下API将在 v1.0.0 中移除：

- `AIModelManager` 类
- `createAIModelManager` 函数
- `aiModelSelected` 实例

请尽快迁移到新的API。

## 🔄 兼容性

- 旧API仍然可用，但会显示弃用警告
- 新API完全向后兼容
- 建议逐步迁移，而不是一次性替换

## 📚 更多示例

查看 `src/examples/NewAPIExample.tsx` 了解完整的使用示例。

## 🆘 需要帮助？

如果您在迁移过程中遇到问题，请：

1. 查看新API文档
2. 参考示例代码
3. 提交Issue获取帮助
