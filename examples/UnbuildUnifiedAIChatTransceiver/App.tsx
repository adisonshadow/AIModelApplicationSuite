import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Bubble, Sender, Attachments, AttachmentsProps } from '@ant-design/x';

import { Flex, Button, Divider, Switch, Badge, Tooltip, type GetProp, type GetRef } from 'antd';
import { LinkOutlined, ApiOutlined, CloudUploadOutlined, RobotOutlined } from '@ant-design/icons';

// AI消息适配器
import { createAIModelSender } from '../../packages/ai_model_application_suite/src';
import type { AIModelSender as IAIModelSender } from '../../packages/ai_model_application_suite/src';

// AI模型选择器
import { AIModelSelect, AIModelManagerComponent, AIProvider, getGlobalAIModelManager } from '../../packages/ai_model_application_suite/src';
import type { AIModelConfig } from '../../packages/ai_model_application_suite/src';

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
  autoContinue?: boolean;
  maxAutoContinue?: number;
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
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showConfigManager, setShowConfigManager] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  
  // 聊天相关状态
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: '你好！我是AI编程专家，有什么可以帮助你的吗？' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  
  // 发送模式
  const [streamMode, setStreamMode] = useState(true); // 默认启用流式响应
  const [autoContinueEnabled, setAutoContinueEnabled] = useState(true); // 默认启用自动继续
  
  // 取消当前请求
  const cancelCurrentRequest = useCallback(() => {
    console.log('🛑🛑🛑 取消请求被调用！', { abortController: !!abortController, loading });
    alert('取消请求被调用！'); // 临时测试用
    
    if (abortController) {
      console.log('🛑 正在取消请求...');
      abortController.abort();
      setAbortController(null);
      setLoading(false);
      
      // 更新最后一条消息为取消状态
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = lastMessage.content + '\n\n[请求已取消]';
        }
        return newMessages;
      });
      
      console.log('✅ 请求已取消');
    } else {
      console.log('⚠️ 没有可取消的请求');
      setLoading(false);
    }
  }, [abortController, loading]);
  
  // 添加 globalAIModelManager 监听
  useEffect(() => {
    // 使用正确的存储配置重新获取管理器实例
    const manager = getGlobalAIModelManager(storageConfig);
    console.log('🔧 创建 manager 实例:', { 
      storageConfig, 
      manager,
      managerStorageConfig: manager.getStorageConfig()
    });
    
    // 初始化管理器
    const initializeManager = async () => {
      try {
        await manager.initialize();
        console.log('✅ globalAIModelManager 初始化完成');
        
        // 获取初始状态
        const currentModelId = manager.getCurrentModelId();
        const configs = manager.getConfigs();
        
        console.log('📋 初始状态:', { currentModelId, configsCount: configs.length });
        
        setSelectedModelId(currentModelId || '');
        setConfigs(configs);
      } catch (error) {
        console.error('❌ globalAIModelManager 初始化失败:', error);
      }
    };
    
    initializeManager();
    
    // 监听选择变化
    const unsubscribe = manager.subscribe('modelSelected', (event: any) => {
      if (event.data?.config) {
        setSelectedModelId(event.data.config.id);
        console.log('🔄 globalAIModelManager 选择变化:', event.data.config);
      }
    });

    // 监听配置列表变化
    const unsubscribeConfigs = manager.subscribe('configsLoaded', (event: any) => {
      setConfigs(event.data || []);
      console.log('📝 globalAIModelManager 配置变化:', event.data);
    });

    return () => {
      unsubscribe();
      unsubscribeConfigs();
    };
  }, []);
  
  // 存储配置
  const storageConfig = useMemo(() => ({
    type: 'localStorage' as const,
    localStorageKey: 'ai-model-configs'
  }), []);
  
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
  
  // 手动继续相关
  const [needsManualContinue, setNeedsManualContinue] = useState<boolean>(false);
  const [continueContext, setContinueContext] = useState<any>(null);
  
  // 监听状态变化
  useEffect(() => {
    console.log('🔍 needsManualContinue 状态变化:', needsManualContinue);
  }, [needsManualContinue]);
  
  useEffect(() => {
    console.log('🔍 continueContext 状态变化:', continueContext ? '有上下文' : '无上下文');
  }, [continueContext]);
  
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
    // console.log('🚀 尝试发送消息:', { 
    //   inputMessage: inputMessage.trim(), 
    //   selectedModelId, 
    //   configsCount: configs.length 
    // });
    
    if (!inputMessage.trim()) {
      console.log('🚫 消息内容为空');
      return;
    }
    
    if (!selectedModelId || selectedModelId.trim() === '') {
      console.log('🚫 未选择模型');
      setError('请先选择一个AI模型配置');
      return;
    }
    
    // console.log('🔍 发送消息调试信息:', { 
    //   selectedModelId, 
    //   configsCount: configs.length, 
    //   configs: configs.map(c => ({ id: c.id, name: c.name }))
    // });
    
    const selectedConfig = configs.find(c => c.id === selectedModelId);
    if (!selectedConfig) {
      console.error('❌ 找不到选中的配置:', { selectedModelId, availableConfigs: configs.map(c => c.id) });
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
    setLoading(true);
    setError(null);

    // 控制台日志：发送请求
    console.log('🚀 发送聊天请求:', {
      timestamp: new Date().toISOString(),
      mode: streamMode,
      userMessage: userMessage.content,
      selectedConfig: {
        id: selectedConfig.id,
        name: selectedConfig.name,
        provider: selectedConfig.provider,
        model: selectedConfig.config?.model,
        baseURL: selectedConfig.config?.baseURL
      },
      autoContinue: autoContinueEnabled,
      maxAutoContinue: 3,
      fullMessages: aiMessages
    });

    try {
      if (streamMode) {
        // 流式聊天 - 使用AI消息适配器的流式方法
        console.log('📡 开始接收流式数据...');
        
        // 先添加一个空的助手消息，用于实时更新
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: ''
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // 使用AI消息适配器的流式方法
        const sender = createRealAISender(selectedConfig);
        
        // 创建 AbortController 用于取消请求
        const controller = new AbortController();
        setAbortController(controller);
        
        // 使用 sendChatMessageStream 方法，支持自动继续
        const response = await sender.sendChatMessageStream(aiMessages, {
          model: selectedConfig.config?.model,
          jsonParams: selectedConfig.config?.jsonParams,
          autoContinue: autoContinueEnabled,
          maxAutoContinue: 3
        }, (chunk: any) => {
          // 实时处理流式数据
          // console.log('🔄 收到流式数据块:', chunk);
          
          if (chunk.choices?.[0]?.delta?.content) {
            // 实时更新消息内容 - chunk.choices[0].delta.content 已经是累积内容
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage && lastMessage.role === 'assistant') {
                lastMessage.content = chunk.choices[0].delta.content; // 直接使用累积内容
              }
              return newMessages;
            });
          }
          
          // 检查自动继续状态
          if (chunk.autoContinueState) {
            console.log('🔄 自动继续状态:', chunk.autoContinueState);
          }
        });
        
        // 创建完整的响应对象用于状态更新
        const completeResponse: ChatResponse = {
          id: response.id || 'unknown',
          model: response.model || selectedConfig.config?.model || 'deepseek-v3-1-250821',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: response.choices?.[0]?.delta?.content || ''
            },
            finishReason: response.choices?.[0]?.finishReason || 'stop'
          }],
          usage: {
            promptTokens: Math.floor(aiMessages.reduce((sum: number, msg: ChatMessage) => sum + msg.content.length, 0) / 4),
            completionTokens: Math.floor((response.choices?.[0]?.delta?.content || '').length / 4),
            totalTokens: Math.floor((aiMessages.reduce((sum: number, msg: ChatMessage) => sum + msg.content.length, 0) + (response.choices?.[0]?.delta?.content || '').length) / 4)
          },
          created: response.created || Math.floor(Date.now() / 1000)
        };
        
        setLastResponse(completeResponse);
        
        // 控制台输出：接收到的内容和 finishReason
        console.log('📥 流式响应完成:', {
          timestamp: new Date().toISOString(),
          responseId: response.id,
          model: response.model,
          contentLength: response.choices?.[0]?.delta?.content?.length || 0,
          contentPreview: response.choices?.[0]?.delta?.content?.slice(-100) || '',
          finishReason: response.choices?.[0]?.finishReason || 'unknown',
          needsManualContinue: response.needsManualContinue || false,
          autoContinueState: response.autoContinueState
        });

        // 检查是否需要手动继续
        console.log('🔍 检查手动继续状态:', {
          needsManualContinue: response.needsManualContinue,
          finishReason: response.choices?.[0]?.finishReason,
          response: response
        });
        
        if (response.needsManualContinue) {
          console.log('🔄 需要手动继续:', response.continueContext);
          console.log('🔄 设置状态: setNeedsManualContinue(true)');
          setNeedsManualContinue(true);
          setContinueContext({
            ...response.continueContext,
            sessionId: response.id // 保存会话ID
          });
          console.log('🔄 状态设置完成');
        } else if (response.choices?.[0]?.finishReason === 'length') {
          // 如果没有自动继续但遇到长度限制，也需要显示继续按钮
          console.log('🔄 检测到长度限制，需要手动继续');
          console.log('🔄 设置状态: setNeedsManualContinue(true)');
          setNeedsManualContinue(true);
          setContinueContext({
            currentMessages: aiMessages,
            accumulatedContent: response.choices[0].delta.content || '',
            attemptCount: 1,
            sessionId: response.id // 保存会话ID
          });
          console.log('🔄 状态设置完成');
        } else {
          console.log('❌ 不需要手动继续，隐藏按钮');
          console.log('❌ 设置状态: setNeedsManualContinue(false)');
          setNeedsManualContinue(false);
          setContinueContext(null);
          console.log('❌ 状态设置完成');
        }
        
        // 检查自动继续状态
        if (response.autoContinueState) {
          console.log('🔄 最终自动继续状态:', response.autoContinueState);
        }
        
        console.log('🏁 流式响应完成');
        
        // 清理 AbortController
        setAbortController(null);
        
      } else {
        // 普通聊天
        console.log('📤 发送普通聊天请求...');
        
        const sender = createRealAISender(selectedConfig);
        const options: SendOptions = {
          model: selectedConfig.config?.model,
          jsonParams: selectedConfig.config?.jsonParams,
          autoContinue: autoContinueEnabled,
          maxAutoContinue: 3
        };
        
        const response = await sender.sendChatMessage(aiMessages, options);
        setLastResponse(response);
        
        // 控制台日志：收到普通响应
        console.log('📥 普通响应完成:', {
          timestamp: new Date().toISOString(),
          responseId: response.id,
          model: response.model,
          contentLength: response.choices[0]?.message?.content?.length || 0,
          contentPreview: response.choices[0]?.message?.content?.slice(-100) || '',
          finishReason: response.choices[0]?.finishReason || 'unknown',
          usage: response.usage,
          autoContinueState: response.autoContinueState
        });
        
        // 检查自动继续状态
        if (response.autoContinueState) {
          console.log('🔄 普通聊天自动继续状态:', response.autoContinueState);
        }
        
        // 清理 AbortController
        setAbortController(null);
        
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.choices[0]?.message?.content || '抱歉，没有收到有效回复'
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        console.log('✅ 普通聊天完成');
      }
    } catch (err: any) {
      // 清理 AbortController
      setAbortController(null);
      
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
      setLoading(false);
      console.log('🏁 聊天请求处理完成');
    }
  };

  // 清空聊天记录
  const clearChat = () => {
    setMessages([{ role: 'system', content: '你好！我是AI编程专家，有什么可以帮助你的吗？' }]);
    setLastResponse(null);
    setError(null);
    setNeedsManualContinue(false);
    setContinueContext(null);
  };

  // 智能内容去重和匹配函数
  const smartContentMerge = (existingContent: string, newContent: string): string => {
    // 获取上次回答的末尾一段文字（超过50个字符）
    const lastSegment = existingContent.slice(-100).replace(/\s+/g, ' ').trim();
    
    if (lastSegment.length < 50) {
      // 如果末尾内容太短，直接追加
      return existingContent + newContent;
    }
    
    // 清理新内容中的空格和回车
    const cleanedNewContent = newContent.replace(/\s+/g, ' ').trim();
    
    // 在新内容中查找匹配的末尾片段
    const matchIndex = cleanedNewContent.indexOf(lastSegment);
    
    if (matchIndex !== -1) {
      // 找到匹配，只取匹配位置后面的内容
      const contentAfterMatch = cleanedNewContent.substring(matchIndex + lastSegment.length);
      console.log('🔍 智能匹配成功:', {
        lastSegment: lastSegment.slice(-30),
        matchIndex,
        contentAfterMatch: contentAfterMatch.slice(0, 50)
      });
      return existingContent + contentAfterMatch;
    } else {
      // 没有找到匹配，检查是否有部分重叠
      for (let i = 20; i <= Math.min(lastSegment.length, 80); i++) {
        const partialSegment = lastSegment.slice(-i);
        const partialMatchIndex = cleanedNewContent.indexOf(partialSegment);
        
        if (partialMatchIndex !== -1) {
          const contentAfterMatch = cleanedNewContent.substring(partialMatchIndex + partialSegment.length);
          console.log('🔍 部分匹配成功:', {
            partialSegment: partialSegment.slice(-20),
            matchIndex: partialMatchIndex,
            contentAfterMatch: contentAfterMatch.slice(0, 50)
          });
          return existingContent + contentAfterMatch;
        }
      }
      
      // 完全没有匹配，直接追加
      console.log('⚠️ 未找到匹配，直接追加新内容');
      return existingContent + newContent;
    }
  };

  // 手动继续
  const handleManualContinue = async () => {
    if (!continueContext || !selectedModelId) {
      console.error('❌ 无法手动继续：缺少上下文或模型');
      return;
    }

    const selectedConfig = configs.find(c => c.id === selectedModelId);
    if (!selectedConfig) {
      console.error('❌ 无法手动继续：找不到选中的配置');
      return;
    }

    console.log('🔄 开始手动继续...');
    setLoading(true);
    setError(null);
    setNeedsManualContinue(false);

    try {
      // 使用继续上下文中的消息和累积内容
      const { currentMessages, accumulatedContent } = continueContext;
      
      // 生成继续消息，包含完整的上下文信息
      // 使用我们生成的会话ID，而不是AI返回的响应ID
      const sessionId = continueContext.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const lastContent = accumulatedContent.slice(-200); // 获取最后200个字符作为上下文
      
      // 控制台输出会话ID信息
      console.log('🔄 手动继续 - 会话ID信息:', {
        sessionId,
        lastResponseId: lastResponse?.id,
        lastResponse: lastResponse,
        accumulatedContentLength: accumulatedContent.length,
        lastContentPreview: lastContent.slice(-50)
      });
      
      const continueMessage: ChatMessage = {
        role: 'user',
        content: `请继续完成上述回答，从上次中断的地方继续。这是同一个会话的继续，不是新的回答。

如果中断不是在代码块中，请不要重复之前的内容。

如果中断是在代码块中，请不要输出代码块标识头（比如\`\`\`html）， 直接输出代码。 从上次中断的这行开始重新输出并输出完整的行，允许行内重复。

上次回答结束在: ${lastContent}
`
      };
      
      // 只使用原始消息 + 继续请求，不包含AI已回答内容
      const continueMessages = [...currentMessages, continueMessage];
      
      // 使用流式模式继续，启用自动继续
      const sender = createRealAISender(selectedConfig);
      let newAccumulatedContent = accumulatedContent; // 从已有内容开始累积
      
      const response = await sender.sendChatMessageStream(continueMessages, {
        model: selectedConfig.config?.model,
        jsonParams: selectedConfig.config?.jsonParams,
        autoContinue: true, // 手动继续也使用自动继续逻辑
        maxAutoContinue: 1 // 手动继续只允许1次自动继续
      }, (chunk: any) => {
        // 实时处理流式数据
        if (chunk.choices?.[0]?.delta?.content) {
          const newContent = chunk.choices[0].delta.content;
          
          // 使用智能内容合并
          newAccumulatedContent = smartContentMerge(accumulatedContent, newContent);
          
          // 实时更新消息内容
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = newAccumulatedContent;
            }
            return newMessages;
          });
        }
      });

      // 更新最终响应
      const finalResponse: ChatResponse = {
        id: response.id || 'manual-continue',
        model: response.model || selectedConfig.config?.model || 'deepseek-v3-1-250821',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: newAccumulatedContent
          },
          finishReason: response.choices?.[0]?.finishReason || 'stop'
        }],
        usage: {
          promptTokens: Math.floor(continueMessages.reduce((sum: number, msg: ChatMessage) => sum + msg.content.length, 0) / 4),
          completionTokens: Math.floor(newAccumulatedContent.length / 4),
          totalTokens: Math.floor((continueMessages.reduce((sum: number, msg: ChatMessage) => sum + msg.content.length, 0) + newAccumulatedContent.length) / 4)
        },
        created: response.created || Math.floor(Date.now() / 1000)
      };

      setLastResponse(finalResponse);

      if (finalResponse.choices[0]?.finishReason) {
        console.log('🐸 中断/结束 原因:', finalResponse.choices[0]?.finishReason);
        // 支持 function call
        if (finalResponse.choices[0]?.finishReason === 'function_call') {
          console.log('🐽 函数调用 原因:', finalResponse.choices[0]?.finishReason);
        }
      }
      
      // 检查是否需要再次手动继续
      if (finalResponse.choices[0]?.finishReason === 'length') {
        // console.log('🔄 手动继续后再次遇到长度限制');
        setNeedsManualContinue(true); // 重要：设置状态为 true
        setContinueContext({
          currentMessages: continueMessages,
          accumulatedContent: newAccumulatedContent,
          attemptCount: 1,
          sessionId: sessionId
        });
        console.log('🔄 重新显示继续按钮');
      } else {
        console.log('✅ 手动继续真正完成');
        setContinueContext(null);
        setNeedsManualContinue(false);
      }
      
      // 控制台日志：手动继续完成
      console.log('📥 手动继续完成:', {
        timestamp: new Date().toISOString(),
        responseId: finalResponse.id,
        model: finalResponse.model,
        contentLength: finalResponse.choices[0]?.message?.content?.length || 0,
        contentPreview: finalResponse.choices[0]?.message?.content?.slice(-100) || '',
        finishReason: finalResponse.choices[0]?.finishReason || 'unknown',
        usage: finalResponse.usage
      });

    } catch (err: any) {
      const errorMessage = `手动继续失败: ${err.message}`;
      setError(errorMessage);
      console.error('❌ 手动继续失败:', err);
    } finally {
      setLoading(false);
    }
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
    console.log('模型选择变化:', modelId);
    setSelectedModelId(modelId);
    // 同时更新 globalAIModelManager
    const manager = getGlobalAIModelManager(storageConfig);
    manager.setCurrentModel(modelId);
  }, [storageConfig]);

  // 处理配置变化
  const handleConfigChange = useCallback((configs: AIModelConfig[]) => {
    console.log('🔧 AIModelManagerComponent 配置变化:', configs);
    setConfigs(configs);
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
                manager={getGlobalAIModelManager(storageConfig)}
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
          
          <div className="sidebar-section">
            <h3>⚙️ 配置管理</h3>
            <div className="model-manager">
              <button 
                onClick={() => setShowConfigManager(!showConfigManager)}
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  marginBottom: '10px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                {showConfigManager ? '隐藏配置管理器' : '显示配置管理器'}
              </button>
              
              {showConfigManager && (
                <AIModelManagerComponent
                  visible={true}
                  onClose={() => setShowConfigManager(false)}
                  storage={storageConfig}
                  supportedProviders={[
                    AIProvider.OPENAI,
                    AIProvider.OPENAILIKE,
                    AIProvider.DEEPSEEK,
                    AIProvider.ANTHROPIC,
                    AIProvider.GOOGLE,
                    AIProvider.VOLCENGINE
                  ]}
                  theme="light"
                  onConfigChange={handleConfigChange}
                />
              )}
            </div>
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
              <div className="stat-item">
                <span className="stat-label">自动继续:</span>
                <span className="stat-value">
                  {autoContinueEnabled ? '已启用' : '已禁用'}
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
                    {/* <span>Token: {lastResponse.usage?.totalTokens || 0}</span> */}
                    <span>模式: {streamMode ? '流式' : '普通'}</span>
                    <span>自动继续: {autoContinueEnabled ? '已启用' : '已禁用'}</span>
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
                  {autoContinueEnabled && <span className="stream-badge">🔄 自动继续</span>}
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
              
              {/* {loading && (
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

            {/* 聊天操作区域 */}
            <div className="chat-actions">
              {(() => {
                // console.log('🔍 UI渲染检查 - 按钮显示条件:', { 
                //   needsManualContinue, 
                //   continueContext: continueContext ? '有上下文' : '无上下文',
                //   timestamp: new Date().toISOString()
                // });
                return null;
              })()}
              {needsManualContinue && (
                <div style={{ 
                  padding: '10px', 
                  textAlign: 'center',
                  backgroundColor: '#f0f9ff',
                  borderTop: '1px solid #e1e5e9',
                  borderBottom: '1px solid #e1e5e9',
                  width: '100%'
                }}>
                  <Tooltip title="AI回答被长度限制中断，请点击继续完成回答">
                    <Button 
                      type="primary" 
                      size="small"
                      onClick={handleManualContinue}
                      disabled={loading}
                      icon={<RobotOutlined />}
                    >
                      继续回答
                    </Button>
                  </Tooltip>
                </div>
              )}
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
                        setLoading(true);
                        sendChatMessage();
                      }}
                      onCancel={() => {
                        console.log('🎯 onCancel 被直接调用！');
                        cancelCurrentRequest();
                      }}
                      placeholder="输入你的消息... 输入 / 获取建议... (Shift+Enter换行，Enter发送)"
                      // disabled={loading}
                      loading={loading}
                      // submitType="enter"
                      // onKeyDown={handleKeyPress}
                      autoSize={{ minRows: 2, maxRows: 6 }}
                      // onFocus={() => {}}
                      // onBlur={() => {}}
                      actions={false} // 这行只要不为false，必然会出现一个发送按钮，所以要么全在这里自定义，要么全在 footer里
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
                              <Divider type="vertical" />
                              <label>
                                自动继续
                                <Switch size="small" checked={autoContinueEnabled} onChange={(checked) => setAutoContinueEnabled(checked)} />
                              </label>
                            </Flex>
                            <Flex align="center">
                              <Button type="text" style={iconStyle} icon={<ApiOutlined />} />
                              <Divider type="vertical" />
                              <SpeechButton style={iconStyle} />
                              <Divider type="vertical" />
                              {loading ? (
                                <Tooltip title="Click to cancel"><LoadingButton type="default" /></Tooltip>
                              ) : (
                                <Tooltip title={inputMessage ? 'Send \u21B5' : 'Please type something'}><SendButton type="primary" disabled={false} /></Tooltip>
                              )}
                            </Flex>
                          </Flex>
                        );
                      }}
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
