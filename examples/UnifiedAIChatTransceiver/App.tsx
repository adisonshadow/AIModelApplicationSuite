import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Bubble, Sender, Attachments, AttachmentsProps } from '@ant-design/x';

import { Flex, Button, Divider, Switch, Badge, type GetProp, type GetRef } from 'antd';
import { LinkOutlined, ApiOutlined, CloudUploadOutlined } from '@ant-design/icons';

// AI消息适配器
import { createAIModelSender } from '@ai-model-application-suite/core';
import type { AIModelSender as IAIModelSender } from '@ai-model-application-suite/core';

// AI模型选择器
import { AIModelSelect, aiModelSelected } from '@ai-model-application-suite/core';
import { AIProvider } from '@ai-model-application-suite/core';
import type { AIModelConfig } from '@ai-model-application-suite/core';

// Suggestion 组件
import { 
  SuggestionComponent, 
  useSuggestionHandler, 
  type SuggestionResult, 
  SmartRenderer,
  PromptTemplateComponent,
  PromptTemplateProcessor,
} from './components';

// 模拟类型定义
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
  status?: 'loading' | 'success' | 'error';
}

interface SendOptions {
  stream?: boolean;
  model?: string;
  jsonParams?: string;
}

interface ChatResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  created: number;
}

// 创建真实AI发送器
const createRealAISender = (config: AIModelConfig): IAIModelSender => {
  try {
    // 转换配置格式以匹配 unified-AI-chat-transceiver 的类型要求
    const convertedConfig = {
      ...config,
      provider: config.provider as any, // 类型转换
      createdAt: config.createdAt.getTime(),
      updatedAt: config.updatedAt.getTime(),
      config: config.config || { apiKey: '' } // 确保 config 存在
    };
    return createAIModelSender(convertedConfig as any);
  } catch (error) {
    console.error('创建AI发送器失败:', error);
    throw error;
  }
};

const AIModelSender: React.FC = () => {
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [configs, setConfigs] = useState<AIModelConfig[]>([]);
  
  // 添加 aiModelSelected 监听
  useEffect(() => {
    // 监听选择变化
    const unsubscribe = aiModelSelected.onChange((config) => {
      if (config) {
        setSelectedModelId(config.id);
        console.log('aiModelSelected 选择变化:', config);
      }
    });

    // 监听配置列表变化
    const unsubscribeConfigs = aiModelSelected.onConfigsChange((newConfigs) => {
      setConfigs(newConfigs);
      console.log('aiModelSelected 配置变化:', newConfigs);
    });

    // 初始化管理器
    aiModelSelected.initialize();

    return () => {
      unsubscribe();
      unsubscribeConfigs();
    };
  }, []);
  
  // 存储配置
  const storageConfig = useMemo(() => ({
    type: 'localStorage' as const,
    localStorageKey: 'demo-local-configs'
  }), []);
  
  // 聊天相关状态
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: '你好！我是AI编程专家，有什么可以帮助你的吗？' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 发送模式
  const [streamMode, setStreamMode] = useState(true); // 默认启用流式响应
  
  // Suggestion 相关状态
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>('');
  const { handleSuggestion } = useSuggestionHandler();
  
  // 提示词模板配置
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // 附件配置
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<GetProp<AttachmentsProps, 'items'>>([]);
  
  // 响应相关
  const [lastResponse, setLastResponse] = useState<ChatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const iconStyle = {
    color: '#666',
    fontSize: '1.2rem'
  };

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 配置加载已由 AIModelSelect 组件自动处理，无需手动加载

  // 发送聊天消息
  const sendChatMessage = async () => {
    if (!inputMessage.trim() || !selectedModelId) return;
    
    const selectedConfig = configs.find(c => c.id === selectedModelId);
    if (!selectedConfig) {
      setError('请先选择一个AI模型配置');
      return;
    }

    // 处理 suggestion
    let processedMessage = inputMessage;
    let suggestionSystemPrompt = '';
    
    if (selectedSuggestion) {
      const suggestionResult: SuggestionResult = handleSuggestion(inputMessage, selectedSuggestion);
      processedMessage = suggestionResult.processedMessage;
      suggestionSystemPrompt = suggestionResult.systemPrompt || '';
    }

    const userMessage: ChatMessage = { role: 'user', content: processedMessage };
    
    // 构建显示消息列表（不包含系统提示词）
    const displayMessages = [...messages, userMessage];
    setMessages(displayMessages);
    
    // 构建发送给AI的消息列表（包含系统提示词）
    let aiMessages = [...messages];
    
    // 添加 suggestion 系统提示词（仅用于AI请求）
    if (suggestionSystemPrompt) {
      const suggestionPrompt: ChatMessage = { 
        role: 'system', 
        content: suggestionSystemPrompt 
      };
      aiMessages = [...aiMessages, suggestionPrompt];
    }
    
    // 如果有选择提示词模板，在用户消息前添加系统提示词（仅用于AI请求）
    if (selectedPromptTemplate && PromptTemplateProcessor.hasValidPrompt(selectedPromptTemplate, customPrompt)) {
      const promptContent = PromptTemplateProcessor.getPromptContent(selectedPromptTemplate, customPrompt);
      const systemPrompt: ChatMessage = { 
        role: 'system', 
        content: promptContent 
      };
      aiMessages = [...aiMessages, systemPrompt];
    }
    
    aiMessages = [...aiMessages, userMessage];
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    // 控制台日志：发送请求
    console.log('🚀 发送聊天请求:', {
      timestamp: new Date().toISOString(),
      mode: streamMode ? '流式聊天' : '普通聊天',
      userMessage: userMessage.content,
      selectedConfig: {
        id: selectedConfig.id,
        name: selectedConfig.name,
        provider: selectedConfig.provider,
        model: selectedConfig.config?.model,
        baseURL: selectedConfig.config?.baseURL
      },
      requestOptions: {
        stream: streamMode,
        model: selectedConfig.config?.model,
        jsonParams: selectedConfig.config?.jsonParams
      },
      fullMessages: aiMessages
    });

    try {
      if (streamMode) {
        // 流式聊天 - 直接处理流式响应
        console.log('📡 开始接收流式数据...');
        
        // 先添加一个空的助手消息，用于实时更新
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: ''
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        try {
          // 直接调用 OpenAI 客户端获取流式响应
          const sender = createRealAISender(selectedConfig);
          const openaiClient = (sender as any).client; // 获取 OpenAI 客户端实例
          
          if (!openaiClient) {
            throw new Error('无法获取 OpenAI 客户端');
          }
          
          // 直接创建流式请求
          const response = await openaiClient.chat.completions.create({
            model: selectedConfig.config?.model || 'deepseek-v3-1-250821',
            messages: aiMessages.map((msg: ChatMessage) => ({
              role: msg.role as 'system' | 'user' | 'assistant',
              content: msg.content
            })),
            stream: true,
            temperature: 0.7,
            max_tokens: 1000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
          });
          
          let fullContent = '';
          let responseId = '';
          let model = selectedConfig.config?.model || 'deepseek-v3-1-250821';
          let created = Math.floor(Date.now() / 1000);
          
          // 实时处理每个 chunk
          for await (const chunk of response as any) {
            // console.log('🔄 收到流式数据块:', chunk);
            
            // 检查是否有 finish_reason
            const isEnd = chunk.choices?.[0]?.finish_reason === 'stop';
            
            if (chunk.id) responseId = chunk.id;
            
            if (chunk.choices && chunk.choices.length > 0) {
              chunk.choices.forEach((choice: any) => {
                if (choice.delta && choice.delta.content) {
                  const deltaContent = choice.delta.content;
                  fullContent += deltaContent;
                  
                  // console.log('📝 收到流式内容:', {
                  //   deltaContent,
                  //   // fullContent,
                  //   isEnd,
                  //   // timestamp: new Date().toISOString()
                  // });
                  
                  // 实时更新消息内容
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'assistant') {
                      lastMessage.content = fullContent;
                      // console.log('✅ 实时更新消息内容:', fullContent);
                    }
                    return newMessages;
                  });
                }
              });
            }
            
            if (isEnd) {
              console.log('🏁 流式响应完成', fullContent);
              break;
            }
          }
          
          // 创建完整的响应对象用于状态更新
          const completeResponse: ChatResponse = {
            id: responseId,
            model: model,
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: fullContent
              },
              finishReason: 'stop'
            }],
            usage: {
              promptTokens: Math.floor(aiMessages.reduce((sum: number, msg: ChatMessage) => sum + msg.content.length, 0) / 4),
              completionTokens: Math.floor(fullContent.length / 4),
              totalTokens: Math.floor((aiMessages.reduce((sum: number, msg: ChatMessage) => sum + msg.content.length, 0) + fullContent.length) / 4)
            },
            created: created
          };
          
          setLastResponse(completeResponse);
          // console.log('✅ 流式响应完成，最终内容:', fullContent);
          
        } catch (streamError: any) {
          // 如果流式处理失败，更新错误消息
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = `❌ 流式响应失败: ${streamError.message}`;
            }
            return newMessages;
          });
          throw streamError;
        }
      } else {
        // 普通聊天
        console.log('📤 发送普通聊天请求...');
        
        const sender = createRealAISender(selectedConfig);
        const options: SendOptions = {
          model: selectedConfig.config?.model,
          jsonParams: selectedConfig.config?.jsonParams
        };
        
        const response = await sender.sendChatMessage(aiMessages, options);
        setLastResponse(response);
        
        // 控制台日志：收到普通响应
        console.log('📥 收到普通响应:', {
          timestamp: new Date().toISOString(),
          responseId: response.id,
          model: response.model,
          content: response.choices[0]?.message?.content,
          usage: response.usage,
          finishReason: response.choices[0]?.finishReason
        });
        
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.choices[0]?.message?.content || '抱歉，没有收到有效回复'
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        console.log('✅ 普通聊天完成');
      }
    } catch (err: any) {
      const errorMessage = `发送失败: ${err.message}`;
      setError(errorMessage);
      
      // 控制台日志：错误信息
      console.error('❌ 聊天请求失败:', {
        timestamp: new Date().toISOString(),
        error: err.message,
        stack: err.stack,
        userMessage: userMessage.content,
        selectedConfig: selectedConfig.id
      });
      
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `❌ 错误: ${errorMessage}`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      console.log('🏁 聊天请求处理完成');
    }
  };

  // 清空聊天记录
  const clearChat = () => {
    setMessages([{ role: 'system', content: '你好！我是AI编程专家，有什么可以帮助你的吗？' }]);
    setLastResponse(null);
    setError(null);
  };

  // 处理 suggestion 选择
  const handleSuggestionSelect = useCallback((value: string) => {
    setSelectedSuggestion(value);
    if (value === 'vis-chart') {
      setInputMessage(`[vis-chart]: `);
    } else {
      setInputMessage(`[${value}]: `);
    }
  }, []);

  // 处理模型选择变化
  const handleModelChange = useCallback((modelId: string) => {
    // 不再需要手动设置，因为 aiModelSelected 已经处理了
    console.log('模型选择变化:', modelId);
  }, []);

  // 处理配置变化
  const handleConfigChange = useCallback((configs: AIModelConfig[]) => {
    // 不再需要手动设置，因为 aiModelSelected 已经处理了
    console.log('配置变化:', configs);
  }, []);

  // 处理回车键发送
  // const handleKeyPress = (e: React.KeyboardEvent) => {
  //   if (e.key === 'Enter' && !e.shiftKey) {
  //     e.preventDefault();
  //     sendChatMessage();
  //   }
  // };

  // 刷新配置
  // const refreshConfigs = () => {
  //   const configsData = loadAIModelConfigs();
  //   setConfigs(configsData);
  //   if (configsData.length > 0 && !configsData.find(c => c.id === selectedModelId)) {
  //     setSelectedModelId(configsData[0].id);
  //   }
  // };

  // 获取当前选中的配置
  const selectedConfig = configs.find(c => c.id === selectedModelId);

  const senderRef = React.useRef<GetRef<typeof Sender>>(null);

  const senderHeader = (
    <Sender.Header
      title="Attachments"
      open={open}
      onOpenChange={setOpen}
      styles={{
        content: {
          padding: 0,
        },
      }}
    >
      <Attachments
        // Mock not real upload file
        beforeUpload={() => false}
        items={items}
        onChange={({ fileList }) => setItems(fileList)}
        placeholder={(type) =>
          type === 'drop'
            ? {
                title: 'Drop file here',
              }
            : {
                icon: <CloudUploadOutlined />,
                title: 'Upload files',
                description: 'Click or drag files to this area to upload',
              }
        }
        getDropContainer={() => senderRef.current?.nativeElement}
      />
    </Sender.Header>
  );


  return (
            <div className="unified-ai-chat-transceiver">
      {/* <div className="sender-header">
        <h1>🤖 AI消息适配器</h1>
        <p>这是一个完整的AI消息适配器演示页面，支持聊天对话功能</p>
      </div> */}

      <div className="sender-container">
        {/* 左侧：模型选择和配置 */}
        <div className="sender-sidebar">
          <div className="sidebar-section">
            <h3>🔧 模型配置</h3>
            <div className="model-selector">
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
                  AIProvider.GOOGLE,
                  AIProvider.VOLCENGINE
                ]}
                placeholder="选择一个AI模型..."
                style={{ 
                  minWidth: '100%'
                }}
                manager={aiModelSelected}
              />
            </div>
            
            {selectedConfig && selectedConfig.config && (
              <div className="model-info">
                <div className="info-row">
                  <span className="info-label">模型ID:</span>
                  <span className="info-value">{selectedConfig.config.model || '未设置'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">提供商:</span>
                  <span className="info-value">{selectedConfig.provider}</span>
                </div>
              </div>
            )}
          </div>

          {/* <div className="sidebar-section">
            <h3>🎯 发送模式</h3>
            
            <div className="mode-selector">
              <div className="mode-option">
                <label>
                  <input
                    type="checkbox"
                    checked={streamMode}
                    onChange={(e) => setStreamMode(e.target.checked)}
                  />
                  🌊 启用流式响应
                </label>
                <small>实时显示AI回复内容，体验更流畅</small>
              </div>
            </div>
          </div> */}

          <PromptTemplateComponent
            selectedTemplate={selectedPromptTemplate}
            customPrompt={customPrompt}
            onTemplateChange={setSelectedPromptTemplate}
            onCustomPromptChange={setCustomPrompt}
          />


          <div className="sidebar-section">
            <h3>📊 使用统计</h3>
            <div className="stats">
              <div className="stat-item">
                <span className="stat-label">消息数量:</span>
                <span className="stat-value">{messages.length - 1}</span>
              </div>
              {lastResponse && (
                <div className="stat-item">
                  <span className="stat-label">Token使用:</span>
                  <span className="stat-value">
                    {lastResponse.usage?.totalTokens || 0}
                  </span>
                </div>
              )}
              <div className="stat-item">
                <span className="stat-label">可用配置:</span>
                <span className="stat-value">{configs.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">当前模式:</span>
                <span className="stat-value">
                  {streamMode ? '流式聊天' : '普通聊天'}
                </span>
              </div>
            </div>
          </div>

          {/* 响应信息显示 */}
          {lastResponse && (
              <div className="sidebar-section">
                <h3>📋 响应信息</h3>
                <div className="info-item">
                  <strong>聊天响应:</strong>
                  <div className="info-details">
                    <span>模型: {lastResponse.model}</span>
                    <span style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>ID: {lastResponse.id}</span>
                    {/* <span>Token: {lastResponse.usage?.totalTokens || 0}</span>
                    <span>模式: {streamMode ? '流式' : '普通'}</span> */}
                  </div>

                  {/* 错误显示 */}
                  {error && (
                    <div className="error-message">
                      <span className="error-icon">❌</span>
                      <span className="error-text">{error}</span>
                    </div>
                  )}

                </div>
              </div>
            )}

        </div>

        {/* 右侧：聊天界面 */}
        <div className="sender-main">
          <div className="chat-container">
                          <div className="chat-header">
                <h3>
                  💬 AI对话
                  {streamMode && <span className="stream-badge">🚰 流式</span>}
                </h3>
              <div className="chat-actions">
                <button
                  className="action-btn secondary"
                  onClick={clearChat}
                  disabled={messages.length <= 1}
                >
                  🗑️ 清空聊天
                </button>
              </div>
            </div>

            {/* 使用 Ant Design X 的 Bubble.List 组件 */}
            <div className="chat-messages" style={{ flex: 1, overflow: 'hidden' }}>
              <Bubble.List
                items={messages?.map((message: ChatMessage, index) => ({
                  ...message,
                  key: index.toString(),
                  role: message.role === 'user' ? 'user' : 'assistant',
                  content: message.content,
                  header: message.role === 'user' ? '用户' : 
                         message.role === 'assistant' ? 'AI助手' : '系统',
                  placement: message.role === 'user' ? 'end' : 'start',
                  variant: message.role === 'user' ? 'filled' : 'outlined',
                  classNames: {
                    content: message.status === 'loading' ? 'loading-message' : '',
                  },
                  typing: message.status === 'loading' ? { step: 5, interval: 20, suffix: <>💗</> } : false,
                }))}
                roles={{
                  user: {
                    placement: 'end',
                    variant: 'filled',
                    header: '用户'
                  },
                  assistant: {
                    placement: 'start',
                    variant: 'outlined',
                    header: 'AI助手',
                    messageRender: SmartRenderer
                  },
                  system: {
                    placement: 'start',
                    variant: 'outlined',
                    header: '系统'
                  }
                }}
                autoScroll={true}
                style={{ height: '100%' }}
              />
              
              {/* {isLoading && (
                <Bubble
                  role="assistant"
                  content={streamMode ? '正在流式生成回复...' : '正在思考中...'}
                  header="AI助手"
                  placement="start"
                  variant="outlined"
                  // loading={true}
                  messageRender={renderMarkdown}
                  typing
                />
              )} */}
              
              <div ref={messagesEndRef} />
            </div>

            {/* 使用 Ant Design X 的 Sender 组件 */}
            <div className="chat-input-container">
              <SuggestionComponent onSuggestionSelect={handleSuggestionSelect}>
                {({ onTrigger }: { onTrigger: (show?: boolean) => void }) => {
                  return (
                    <Sender
                      ref={senderRef}
                      header={senderHeader}
                      // prefix={null}
                      value={inputMessage}
                      onChange={(nextVal) => {
                        if (nextVal === '/') {
                          onTrigger();
                        } else if (!nextVal) {
                          onTrigger(false);
                        }
                        setInputMessage(nextVal);
                      }}
                      onSubmit={() => {
                        setIsLoading(true);
                        sendChatMessage();
                      }}
                      placeholder="输入你的消息... 输入 / 获取建议... (Shift+Enter换行，Enter发送)"
                      disabled={isLoading}
                      // submitType="enter"
                      // onKeyDown={handleKeyPress}
                      autoSize={{ minRows: 2, maxRows: 6 }}
                      // onFocus={() => {}}
                      // onBlur={() => {}}
                      footer={({ components }) => {
                        const { SendButton, LoadingButton, SpeechButton } = components;
                        return (
                          <Flex justify="space-between" align="center">
                            <Flex gap="small" align="center">
                              {/* <Attachments
                                beforeUpload={() => false}
                                onChange={({ file }) => {
                                  message.info(`Mock upload: ${file.name}`);
                                }}
                                getDropContainer={() => document.body}
                                placeholder={{
                                  icon: <CloudUploadOutlined />,
                                  title: 'Drag & Drop files here',
                                  description: 'Support file type: image, video, audio, document, etc.',
                                }}
                              >
                                <Button type="text" icon={<LinkOutlined />} />
                              </Attachments> */}
                              <Badge dot={items.length > 0 && !open}>
                                <Button onClick={() => setOpen(!open)} icon={<LinkOutlined />} />
                              </Badge>
                              <Divider type="vertical" />
                              <label>
                                流式聊天
                                <Switch size="small"  checked={streamMode} onChange={(checked) => setStreamMode(checked)} />
                              </label>
                            </Flex>
                            <Flex align="center">
                              <Button type="text" style={iconStyle} icon={<ApiOutlined />} />
                              <Divider type="vertical" />
                              <SpeechButton style={iconStyle} />
                              <Divider type="vertical" />
                              {isLoading ? (
                                <LoadingButton type="default" />
                              ) : (
                                <SendButton type="primary" disabled={false} />
                              )}
                            </Flex>
                          </Flex>
                        );
                      }}
                      onCancel={() => {
                        setIsLoading(false);
                      }}
                      actions={false}
                    />
                  )}}
              </SuggestionComponent>
            </div>
          </div>

          
        </div>
      </div>
    </div>
  );
};

export default AIModelSender;
