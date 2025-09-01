import React, { useState, useEffect, useRef } from 'react';
import { Bubble, Sender, Suggestion, Attachments, AttachmentsProps } from '@ant-design/x';
import type { BubbleProps } from '@ant-design/x';

import { Flex, Button, Divider, Switch, Badge, type GetProp, type GetRef, message } from 'antd';
import { LinkOutlined, ApiOutlined, CloudUploadOutlined, ReadOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';

import Markdown from 'react-markdown'

// AI模型发送器
import { createAIModelSender } from '../../packages/ai-model-sender';
import type { AIModelSender as IAIModelSender } from '../../packages/ai-model-sender';

// Chart 渲染
import { GPTVis } from '@antv/gpt-vis';
import remarkGfm from 'remark-gfm';

// @ts-ignore
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
// @ts-ignore
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'; // dracula  // https://react-syntax-highlighter.github.io/react-syntax-highlighter/demo/prism.html

// 自定义代码块组件 - 支持图表和带header的代码高亮
const CustomCodeBlock: React.FC<any> = (props) => {
  const { children, className, node, ...rest } = props;
  const [copied, setCopied] = useState(false);
  
  // 检查是否是图表代码块
  if (className === 'language-vis-chart') {
    console.log("🔍 GPTVis", children);
    return (
      <div style={{ margin: '16px 0' }}>
        <GPTVis>
          {String(children)}
        </GPTVis>
      </div>
    );
  }
  
  // 检查是否是带语言标识的代码块
  const match = /language-(\w+)/.exec(className || '');
  if (match) {
    const language = match[1];
    const codeContent = String(children).replace(/\n$/, '');
    
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(codeContent);
        setCopied(true);
        message.success('代码已复制到剪贴板');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        message.error('复制失败');
      }
    };
    
    return (
      <div style={{ margin: '16px 0' }}>
        {/* 代码块Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          backgroundColor: '#1e1e1e',
          borderTopLeftRadius: '6px',
          borderTopRightRadius: '6px',
          borderBottom: '1px solid #333',
          fontSize: '12px',
          color: '#ccc'
        }}>
          <span style={{ 
            textTransform: 'uppercase', 
            fontWeight: '500',
            color: '#fff'
          }}>
            {language}
          </span>
          <Button
            type="text"
            size="small"
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={handleCopy}
            style={{
              color: copied ? '#52c41a' : '#ccc',
              padding: '4px 8px',
              height: 'auto',
              minHeight: 'auto'
            }}
          >
            {copied ? '已复制' : '复制'}
          </Button>
        </div>
        
        {/* 代码内容 */}
        <SyntaxHighlighter
          {...rest}
          PreTag="div"
          children={codeContent}
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: '6px',
            borderBottomRightRadius: '6px'
          }}
        />
      </div>
    );
  }
  
  // 普通代码块
  return (
    <code {...rest} className={className}>
      {children}
    </code>
  );
};

// 智能渲染器 - 结合 GPTVis 和代码块渲染
const SmartRenderer: BubbleProps['messageRender'] = (content) => {  
  // 统一设置 minWidth，确保内容有足够的显示空间
  const containerStyle = { 
    minWidth: '600px',
    width: '100%'
  };

  return (
    <div style={containerStyle}>
      <Markdown 
        remarkPlugins={[remarkGfm]} 
        components={{ 
          code: CustomCodeBlock
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};



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

// AI模型配置接口 - 与AIModelSelector保持一致
interface AIModelConfig {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  config: {
    apiKey: string;
    baseURL: string;
    model?: string;
    jsonParams?: string;
  };
}

// 直接从localStorage读取AIModelSelector的配置
const loadAIModelConfigs = (): AIModelConfig[] => {
  try {
    // 尝试读取API模式的配置
    const apiConfigs = localStorage.getItem('demo-api-configs');
    if (apiConfigs) {
      return JSON.parse(apiConfigs).map((config: any) => ({
        ...config,
        createdAt: config.createdAt || new Date().toISOString(),
        updatedAt: config.updatedAt || new Date().toISOString()
      }));
    }
    
    // 尝试读取localStorage模式的配置
    const localConfigs = localStorage.getItem('demo-local-configs');
    if (localConfigs) {
      return JSON.parse(localConfigs).map((config: any) => ({
        ...config,
        createdAt: config.createdAt || new Date().toISOString(),
        updatedAt: config.updatedAt || new Date().toISOString()
      }));
    }
    
    // 如果没有配置，返回默认配置
    return [
      {
        id: 'demo-default',
        name: 'GPT-4 默认配置',
        provider: 'OpenAI',
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        config: {
          apiKey: 'sk-demo-key-hidden',
          baseURL: 'https://api.openai.com/v1',
          model: 'gpt-4'
        }
      }
    ];
  } catch (error) {
    console.error('加载AI模型配置失败:', error);
    return [];
  }
};

// 创建真实AI发送器
const createRealAISender = (config: AIModelConfig): IAIModelSender => {
  try {
    // 转换配置格式以匹配 ai-model-sender 的类型要求
    const convertedConfig = {
      ...config,
      provider: config.provider as any, // 类型转换
      createdAt: new Date(config.createdAt).getTime(),
      updatedAt: new Date(config.updatedAt).getTime()
    };
    return createAIModelSender(convertedConfig);
  } catch (error) {
    console.error('创建AI发送器失败:', error);
    throw error;
  }
};

type SuggestionItems = Exclude<GetProp<typeof Suggestion, 'items'>, () => void>;

const suggestions: SuggestionItems = [
  { label: 'Write a report', value: 'report' },
  { label: 'Draw a picture', value: 'draw' },
  { label: 'Create a chart', value: 'chart' },
  {
    label: 'Check some knowledge',
    value: 'knowledge',
    icon: <ReadOutlined />,
    children: [
      {
        label: 'About React',
        value: 'react',
      },
      {
        label: 'About Ant Design',
        value: 'antd',
      },
    ],
  },
];



const AIModelSender: React.FC = () => {
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [configs, setConfigs] = useState<AIModelConfig[]>([]);
  
  // 聊天相关状态
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: '你好！我是AI助手，有什么可以帮助你的吗？' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 发送模式
  const [streamMode, setStreamMode] = useState(true); // 默认启用流式响应
  
  // 提示词模板配置
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // 附件配置
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<GetProp<AttachmentsProps, 'items'>>([]);
  
  // 提示词配置
  // const [suggestionValue, setSuggestionValue] = useState<string>('');

  // 内置提示词模板
  const promptTemplates = [
    {
      id: 'json',
      name: 'JSON格式',
      description: '强制返回的内容为JSON格式',
      prompt: '请严格按照JSON格式返回，不要包含任何其他文字说明。'
    },
    {
      id: 'html-css',
      name: 'HTML/CSS代码',
      description: '强制返回的内容为HTML/CSS代码',
      prompt: '请返回完整的HTML和CSS代码，不要包含任何解释文字。'
    },
    {
      id: 'python',
      name: 'Python代码',
      description: '强制返回的内容为Python代码',
      prompt: '请返回完整的Python代码，包含必要的注释，不要包含任何解释文字。'
    },
    {
      id: 'markdown',
      name: 'Markdown格式',
      description: '强制返回的内容为Markdown格式',
      prompt: '请使用Markdown格式返回，包含适当的标题、列表、代码块等。'
    },
    {
      id: 'chart',
      name: '图表生成',
      description: '生成包含图表的回复',
      prompt: '请生成一个包含图表的回复，使用 ```vis-chart 代码块来包装图表数据。图表数据应该是JSON格式，包含type、data、axisXTitle、axisYTitle等字段。'
    },
    {
      id: 'custom',
      name: '自定义提示词',
      description: '使用自定义的提示词',
      prompt: ''
    }
  ];
  
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

  // 加载配置 - 直接从localStorage读取AIModelSelector的配置
  useEffect(() => {
    const loadConfigs = () => {
      try {
        const configsData = loadAIModelConfigs();
        setConfigs(configsData);
        if (configsData.length > 0) {
          setSelectedModelId(configsData[0].id);
        }
      } catch (err) {
        console.error('加载配置失败:', err);
      }
    };
    
    loadConfigs();
    
    // 监听localStorage变化，实时更新配置
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'demo-api-configs' || e.key === 'demo-local-configs') {
        loadConfigs();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 定期检查配置更新（因为同页面localStorage变化不会触发storage事件）
    const interval = setInterval(loadConfigs, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // 发送聊天消息
  const sendChatMessage = async () => {
    if (!inputMessage.trim() || !selectedModelId) return;
    
    const selectedConfig = configs.find(c => c.id === selectedModelId);
    if (!selectedConfig) {
      setError('请先选择一个AI模型配置');
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: inputMessage };
    
    // 如果有选择提示词模板，在用户消息前添加系统提示词
    let newMessages = [...messages];
    if (selectedPromptTemplate && (customPrompt || promptTemplates.find(t => t.id === selectedPromptTemplate)?.prompt)) {
      const promptContent = customPrompt || promptTemplates.find(t => t.id === selectedPromptTemplate)?.prompt || '';
      const systemPrompt: ChatMessage = { 
        role: 'system', 
        content: promptContent 
      };
      newMessages = [...messages, systemPrompt, userMessage];
    } else {
      newMessages = [...messages, userMessage];
    }
    
    setMessages(newMessages);
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
        model: selectedConfig.config.model,
        baseURL: selectedConfig.config.baseURL
      },
      requestOptions: {
        stream: streamMode,
        model: selectedConfig.config.model,
        jsonParams: selectedConfig.config.jsonParams
      },
      fullMessages: newMessages
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
            model: selectedConfig.config.model || 'deepseek-v3-1-250821',
            messages: newMessages.map(msg => ({
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
          let model = selectedConfig.config.model || 'deepseek-v3-1-250821';
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
              promptTokens: Math.floor(newMessages.reduce((sum, msg) => sum + msg.content.length, 0) / 4),
              completionTokens: Math.floor(fullContent.length / 4),
              totalTokens: Math.floor((newMessages.reduce((sum, msg) => sum + msg.content.length, 0) + fullContent.length) / 4)
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
          model: selectedConfig.config.model,
          jsonParams: selectedConfig.config.jsonParams
        };
        
        const response = await sender.sendChatMessage(newMessages, options);
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
    setMessages([{ role: 'system', content: '你好！我是AI助手，有什么可以帮助你的吗？' }]);
    setLastResponse(null);
    setError(null);
  };

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
    <div className="ai-model-sender">
      {/* <div className="sender-header">
        <h1>🤖 AI模型发送器</h1>
        <p>这是一个完整的AI模型发送器演示页面，支持聊天对话功能</p>
      </div> */}

      <div className="sender-container">
        {/* 左侧：模型选择和配置 */}
        <div className="sender-sidebar">
          <div className="sidebar-section">
            <h3>🔧 模型配置</h3>
            <div className="model-selector">
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="model-select"
              >
                <option value="">选择AI模型...</option>
                {configs.map(config => (
                  <option key={config.id} value={config.id}>
                    {config.name} ({config.provider})
                  </option>
                ))}
              </select>
            </div>
            
            {selectedConfig && (
              <div className="model-info">
                <div className="info-row">
                  <span className="info-label">模型ID:</span>
                  <span className="info-value">{selectedConfig.config.model || '未设置'}</span>
                </div>
                {/* <div className="info-row">
                  <span className="info-label">API地址:</span>
                  <span className="info-value">{selectedConfig.config.baseURL}</span>
                </div> */}
              </div>
            )}
            
            {/* <div className="config-actions">
              <button
                className="config-manager-btn"
                onClick={refreshConfigs}
              >
                🔄 刷新配置
              </button>
              
              <div className="config-status">
                <small>
                  📍 配置来源: {configs.length > 0 ? 
                    (localStorage.getItem('demo-api-configs') ? 'API模式' : 'LocalStorage模式') : 
                    '无配置'}
                </small>
              </div>
            </div> */}
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

          <div className="sidebar-section">
            <h3>🎭 开发用提示词追加</h3>
            <div className="prompt-templates">
              <div className="template-selector">
                <select
                  value={selectedPromptTemplate}
                  onChange={(e) => {
                    setSelectedPromptTemplate(e.target.value);
                    if (e.target.value !== 'custom') {
                      const template = promptTemplates.find(t => t.id === e.target.value);
                      setCustomPrompt(template?.prompt || '');
                    }
                  }}
                  className="template-select"
                >
                  <option value="">不使用模板</option>
                  {promptTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedPromptTemplate === 'custom' && (
                <div className="custom-prompt">
                  <label>自定义提示词:</label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="输入自定义提示词..."
                    rows={3}
                    className="custom-prompt-input"
                  />
                </div>
              )}
              
              {selectedPromptTemplate && (
                <div className="template-preview">
                  <small>
                    <strong>当前模板:</strong> {promptTemplates.find(t => t.id === selectedPromptTemplate)?.name}
                  </small>
                  <div className="template-content">
                    {customPrompt || promptTemplates.find(t => t.id === selectedPromptTemplate)?.prompt}
                  </div>
                </div>
              )}
            </div>
          </div>


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
              <Suggestion
                items={suggestions}
                onSelect={(itemVal) => {
                  setInputMessage(`[${itemVal}]:`);
                }}
              >
                {({ onTrigger }) => {
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
              </Suggestion>
            </div>
          </div>

          
        </div>
      </div>
    </div>
  );
};

export default AIModelSender;
