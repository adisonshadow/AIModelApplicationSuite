# OpenAI 流式对话 Demo

这是一个简单的流式对话演示，使用 OpenAI SDK 连接火山引擎豆包模型。

## 特性

- ✅ 只使用 OpenAI SDK，不依赖项目其他包
- ✅ 不使用 ant-design、antx 等 UI 库
- ✅ 实现流式输出，实时显示 AI 响应
- ✅ 现代化 UI 设计
- ✅ 支持停止生成
- ✅ 支持清空对话
- ✅ 键盘快捷键（Enter 发送，Shift+Enter 换行）

## 配置

当前配置连接到火山引擎豆包模型：

```javascript
{
  apiKey: '7fc0b313-69cb-420d-b7f3-04e6658242e6',
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  model: 'doubao-seed-1-6-250615',
}
```

## 注意事项

⚠️ 由于使用了 `dangerouslyAllowBrowser: true`，此 demo 仅适用于开发环境。生产环境应该：
1. 将 API 调用移到后端
2. 使用后端代理来保护 API Key
3. 不要在前端暴露 API Key

## 运行

在 examples 目录下运行开发服务器即可使用此 demo。


