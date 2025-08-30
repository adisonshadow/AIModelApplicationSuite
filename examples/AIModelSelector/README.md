# Examples

这个目录包含了 React AI Model Manager 组件的各种示例应用。

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

**运行方式：**
```bash
cd AIModelSelector
npm install
npm run dev
```

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
