import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Typography, 
  Button, 
  message,
  Splitter
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  CopyOutlined,
  LikeOutlined,
  DislikeOutlined
} from '@ant-design/icons';
import { Sender, Conversations } from '@ant-design/x';
import './App.css';

// AI消息适配器 - 使用未编译的源码
import { 
  createAIModelSender, 
  AIProvider,
  SimpleAIConfig
} from '../../packages/ai_model_application_suite/src';

// 系统提示词
import { DEFAULT_SYSTEM_CONTEXT } from './systemContext';

// Function calling
import { AI_GIRLFRIEND_FUNCTIONS, functionCallHandler } from './functionCalls';

const { Title } = Typography;

// 生成UUID函数
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// 默认AI配置
const AI_CONFIG: SimpleAIConfig = {
  provider: AIProvider.VOLCENGINE,
  config: {
    apiKey: '7fc0b313-69cb-420d-b7f3-04e6658242e6',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    // model: 'deepseek-v3-1-250821',
    model: 'doubao-seed-1-6-250615',
  }
};

// 消息类型定义
interface MessageType {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning_content?: string;
  timestamp: number;
}

// 会话类型定义
interface ConversationType {
  key: string;
  label: string;
  group: string;
  messages: MessageType[];
  systemContext: string;
  sessionId: string;
}


const App: React.FC = () => {
  
  // ==================== State ====================
  const [sender, setSender] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showReasoning, setShowReasoning] = useState(true);
  const [showFunctionCalls, setShowFunctionCalls] = useState(false);
  const abortController = useRef<AbortController | null>(null);
  const senderRef = useRef<HTMLDivElement>(null);
  
  // 会话管理
  const [conversations, setConversations] = useState<ConversationType[]>([
    {
      key: 'default-0',
      label: 'conversation',
      group: 'Today',
      messages: [],
      systemContext: DEFAULT_SYSTEM_CONTEXT,
      sessionId: generateUUID()
    }
  ]);
  const [currentConversation, setCurrentConversation] = useState('default-0');
  
  // 消息历史记录
  const [messageHistory, setMessageHistory] = useState<Record<string, MessageType[]>>({});

  // ==================== 初始化 ====================
  useEffect(() => {
    let isMounted = true;
    
    const initSender = async () => {
      try {
        const aiSender = await createAIModelSender(AI_CONFIG);
        if (isMounted) {
          setSender(aiSender);
          console.log('✅ AI发送器初始化成功');
        }
      } catch (error) {
        if (isMounted) {
          console.error('❌ AI发送器初始化失败:', error);
          message.error('AI发送器初始化失败');
        }
      }
    };
    
    initSender();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // ==================== Function Calling 设置 ====================
  useEffect(() => {
    // 设置摇晃发送器处理器
    functionCallHandler.setShakeSenderHandler((intensity, reason) => {
      if (senderRef.current) {
        const element = senderRef.current;
        const shakeClass = `shake-${intensity}`;
        
        // 添加摇晃动画类
        element.classList.add(shakeClass);
        
        // 2秒后移除动画类
        setTimeout(() => {
          element.classList.remove(shakeClass);
        }, 2000);
        
        console.log(`💫 摇晃发送器: ${intensity} - ${reason}`);
      }
    });

    // 设置屏幕闪烁处理器
    functionCallHandler.setScreenFlashHandler((color, duration, reason) => {
      // 颜色值映射
      const colorMap: Record<string, string> = {
        'pink': '#FFC0CB',
        'blue': '#007BFF',
        'yellow': '#FFFF00',
        'green': '#00FF00',
        'purple': '#800080',
        'red': '#FF0000',
        'orange': '#FFA500',
        'cyan': '#00FFFF'
      };
      
      const actualColor = colorMap[color] || color || '#800080';
      const actualDuration = duration || 2;
      
      const flashDiv = document.createElement('div');
      flashDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: ${actualColor};
        opacity: 0.3;
        z-index: 9999;
        pointer-events: none;
        animation: flash ${actualDuration}s ease-in-out;
      `;
      
      // 添加闪烁动画
      const style = document.createElement('style');
      style.textContent = `
        @keyframes flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }
      `;
      document.head.appendChild(style);
      
      document.body.appendChild(flashDiv);
      
      setTimeout(() => {
        if (document.body.contains(flashDiv)) {
          document.body.removeChild(flashDiv);
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }, actualDuration * 1000);
      
      console.log(`✨ 屏幕闪烁: ${actualColor} - ${actualDuration}秒 - ${reason}`);
    });

    // 设置消息显示处理器 - 使用更丰富的message API
    functionCallHandler.setShowMessageHandler((type, content, duration, position, customStyle) => {
      // 设置消息配置
      const messageConfig = {
        type: type as 'success' | 'info' | 'warning' | 'error' | 'loading',
        content: content,
        duration: duration === 0 ? 0 : duration, // 0表示不自动关闭
        style: {
          marginTop: '20px',
          fontSize: '14px',
          fontWeight: '500',
          ...customStyle // 合并自定义样式
        },
        // 添加自定义图标
        icon: type === 'success' ? '✅' : 
              type === 'error' ? '❌' : 
              type === 'warning' ? '⚠️' : 
              type === 'loading' ? '⏳' : 'ℹ️'
      };

      // 根据位置显示消息
      if (position) {
        // 根据位置设置不同的样式
        const positionStyle = {
          ...messageConfig.style,
          marginLeft: position.includes('Left') ? '20px' : 
                     position.includes('Right') ? 'auto' : undefined,
          marginRight: position.includes('Right') ? '20px' : undefined
        };
        
        message.open({
          ...messageConfig,
          style: positionStyle
        });
      } else {
        message.open(messageConfig);
      }
      
      console.log(`📢 显示消息: ${type} - ${content} - ${duration}秒 - 位置: ${position || 'top'}`);
    });

    // 设置音效播放处理器
    functionCallHandler.setPlaySoundHandler((sound, volume, reason) => {
      // 这里可以添加实际的音效播放逻辑
      console.log(`🔊 播放音效: ${sound} - 音量${volume} - ${reason}`);
    });

    // 设置背景闪烁处理器
    functionCallHandler.setFlashBgHandler((color, duration, intensity, reason) => {
      const chatElement = document.querySelector('.chat') as HTMLElement;
      if (chatElement) {
        // 根据强度设置不同的透明度
        const opacityMap: Record<string, number> = {
          'gentle': 0.1,
          'medium': 0.3,
          'strong': 0.5
        };
        
        const opacity = opacityMap[intensity] || 0.3;
        
        // 创建闪烁效果
        const originalBg = chatElement.style.backgroundColor;
        const flashBg = `rgba(${getColorValue(color)}, ${opacity})`;
        
        // 添加闪烁动画类
        const flashClass = `flash-bg-${intensity}`;
        chatElement.classList.add(flashClass);
        chatElement.style.backgroundColor = flashBg;
        
        // 创建CSS动画
        const style = document.createElement('style');
        style.textContent = `
          .flash-bg-gentle {
            animation: flashBgGentle ${duration}s ease-in-out;
          }
          .flash-bg-medium {
            animation: flashBgMedium ${duration}s ease-in-out;
          }
          .flash-bg-strong {
            animation: flashBgStrong ${duration}s ease-in-out;
          }
          @keyframes flashBgGentle {
            0%, 100% { background-color: ${originalBg || 'transparent'}; }
            25% { background-color: ${flashBg}; }
            50% { background-color: ${originalBg || 'transparent'}; }
            75% { background-color: ${flashBg}; }
          }
          @keyframes flashBgMedium {
            0%, 100% { background-color: ${originalBg || 'transparent'}; }
            10% { background-color: ${flashBg}; }
            20% { background-color: ${originalBg || 'transparent'}; }
            30% { background-color: ${flashBg}; }
            40% { background-color: ${originalBg || 'transparent'}; }
            50% { background-color: ${flashBg}; }
            60% { background-color: ${originalBg || 'transparent'}; }
            70% { background-color: ${flashBg}; }
            80% { background-color: ${originalBg || 'transparent'}; }
            90% { background-color: ${flashBg}; }
          }
          @keyframes flashBgStrong {
            0%, 100% { background-color: ${originalBg || 'transparent'}; }
            5% { background-color: ${flashBg}; }
            10% { background-color: ${originalBg || 'transparent'}; }
            15% { background-color: ${flashBg}; }
            20% { background-color: ${originalBg || 'transparent'}; }
            25% { background-color: ${flashBg}; }
            30% { background-color: ${originalBg || 'transparent'}; }
            35% { background-color: ${flashBg}; }
            40% { background-color: ${originalBg || 'transparent'}; }
            45% { background-color: ${flashBg}; }
            50% { background-color: ${originalBg || 'transparent'}; }
            55% { background-color: ${flashBg}; }
            60% { background-color: ${originalBg || 'transparent'}; }
            65% { background-color: ${flashBg}; }
            70% { background-color: ${originalBg || 'transparent'}; }
            75% { background-color: ${flashBg}; }
            80% { background-color: ${originalBg || 'transparent'}; }
            85% { background-color: ${flashBg}; }
            90% { background-color: ${originalBg || 'transparent'}; }
            95% { background-color: ${flashBg}; }
          }
        `;
        document.head.appendChild(style);
        
        // 动画结束后清理
        setTimeout(() => {
          chatElement.classList.remove(flashClass);
          chatElement.style.backgroundColor = originalBg;
          if (document.head.contains(style)) {
            document.head.removeChild(style);
          }
        }, duration * 1000);
      }
      
      console.log(`🎨 背景闪烁: ${color} - ${intensity} - ${duration}秒 - ${reason}`);
    });
    
    // 颜色值映射函数
    const getColorValue = (color: string): string => {
      const colorMap: Record<string, string> = {
        'pink': '255, 192, 203',
        'blue': '0, 123, 255',
        'yellow': '255, 255, 0',
        'green': '0, 255, 0',
        'purple': '128, 0, 128',
        'red': '255, 0, 0',
        'orange': '255, 165, 0',
        'cyan': '0, 255, 255'
      };
      return colorMap[color] || '128, 128, 128';
    };
  }, []);

  // ==================== 会话管理 ====================
  const createNewConversation = () => {
    if (loading) {
      message.error('消息发送中，请等待完成后再创建新会话');
      return;
    }

    const newKey = `conversation-${Date.now()}`;
    const newConversation: ConversationType = {
      key: newKey,
      label: `新对话 ${conversations.length + 1}`,
      group: 'Today',
      messages: [],
      systemContext: DEFAULT_SYSTEM_CONTEXT,
      sessionId: generateUUID()
    };

    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newKey);
    setMessageHistory(prev => ({ ...prev, [newKey]: [] }));
  };

  const switchConversation = (key: string) => {
    if (loading) {
      message.error('消息发送中，请等待完成后再切换会话');
      return;
    }
    setCurrentConversation(key);
  };

  const deleteConversation = (key: string) => {
    const newConversations = conversations.filter(item => item.key !== key);
    setConversations(newConversations);
    
    if (key === currentConversation) {
      const newCurrentKey = newConversations[0]?.key;
      if (newCurrentKey) {
        setCurrentConversation(newCurrentKey);
      }
    }
    
    // 清理消息历史
    setMessageHistory(prev => {
      const newHistory = { ...prev };
      delete newHistory[key];
      return newHistory;
    });
  };

  // ==================== Function Calling 处理 ====================
  const processFunctionCalls = async (content: string) => {
    // 处理 <|FunctionCallBegin|>...<|FunctionCallEnd|> 格式
    const specialFormatRegex = /<\|FunctionCallBegin\|>(.*?)<\|FunctionCallEnd\|>/gs;
    const specialMatches = content.match(specialFormatRegex);
    
    if (specialMatches) {
      for (const match of specialMatches) {
        const jsonStr = match.replace(/<\|FunctionCallBegin\|>/, '').replace(/<\|FunctionCallEnd\|>/, '');
        console.log('🔧 检测到特殊格式函数调用:', jsonStr);
        
        try {
          const functionCalls = JSON.parse(jsonStr);
          if (Array.isArray(functionCalls)) {
            for (const call of functionCalls) {
              const result = await functionCallHandler.executeFunctionCall(call.name, call.parameters);
              console.log('✅ 特殊格式函数调用执行结果:', result);
            }
          }
        } catch (error) {
          console.error('❌ 解析特殊格式函数调用失败:', error);
        }
      }
    }
    
    // 处理文本格式 (function_call: name:args)
    const textFormatRegex = /\(function_call:\s*(\w+):([^)]+)\)/g;
    let match;
    
    while ((match = textFormatRegex.exec(content)) !== null) {
      const functionName = match[1];
      const functionArgs = match[2];
      
      console.log('🔧 检测到文本格式函数调用:', {
        name: functionName,
        args: functionArgs
      });
      
      // 解析参数
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(`{"${functionName === 'flash_bg' ? 'color' : functionName === 'shake_sender' ? 'intensity' : 'value'}": "${functionArgs}"}`);
      } catch (e) {
        if (functionName === 'flash_bg') {
          parsedArgs = { color: functionArgs, duration: 2, intensity: 'medium', reason: '增强视觉效果' };
        } else if (functionName === 'shake_sender') {
          parsedArgs = { intensity: functionArgs, reason: '撒娇互动' };
        } else if (functionName === 'screen_flash') {
          parsedArgs = { color: functionArgs, duration: 2, reason: '增强效果' };
        } else if (functionName === 'show_message') {
          parsedArgs = { type: 'info', content: functionArgs, duration: 3 };
        } else if (functionName === 'play_sound_effect') {
          parsedArgs = { sound: functionArgs, volume: 0.5, reason: '增强氛围' };
        }
      }
      
      const result = await functionCallHandler.executeFunctionCall(functionName, parsedArgs);
      console.log('✅ 文本格式函数调用执行结果:', result);
    }
  };

  // ==================== 消息处理 ====================
  
  // 过滤消息内容，隐藏函数调用文本
  const filterMessageContent = (content: string): string => {
    if (!showFunctionCalls) {
      // 移除特殊格式的函数调用文本
      content = content.replace(/<\|FunctionCallBegin\|>.*?<\|FunctionCallEnd\|>/gs, '');
      
      // 移除文本格式的函数调用
      content = content.replace(/\(function_call:\s*\w+:[^)]+\)/g, '');
      
      // 清理多余的空格和换行
      content = content.replace(/\s+/g, ' ').trim();
    }
    return content;
  };

  const sendToAI = async (userMessage: string, systemContext?: string, sessionIdParam?: string) => {
    
    if (!sender || loading) return;

    // 创建新的 AbortController
    const controller = new AbortController();
    abortController.current = controller;

    // 标记是否已经处理过函数调用（避免重复执行）
    let functionCallsProcessed = false;

    // 记录 function calling 注册（每次都会注册）
    console.log('🎯 注册 function calling 到模型');
    console.log('📋 注册的函数列表:', AI_GIRLFRIEND_FUNCTIONS.map(f => f.name));

    const userMsgObj: MessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };

    const assistantMessage: MessageType = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      reasoning_content: '',
      timestamp: Date.now()
    };

    // 更新当前会话的消息
    const currentConv = conversations.find(c => c.key === currentConversation);
    if (!currentConv) return;

    // 获取当前会话的历史消息
    const currentMessages = messageHistory[currentConversation] || [];
    const newMessages = [...currentMessages, userMsgObj, assistantMessage];
    setMessageHistory(prev => ({
      ...prev,
      [currentConversation]: newMessages
    }));

    setLoading(true);

    try {
      // 构建消息历史（包含新添加的用户消息）
      let chatMessages = [...currentMessages, userMsgObj].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // 如果有系统上下文，插入到消息列表开头
      if (systemContext && systemContext.trim()) {
        chatMessages = [
          { role: 'system', content: systemContext.trim() },
          ...chatMessages
        ];
      }

      // 准备发送选项
      const options: any = { 
        stream: true,
        // 每次对话都添加 function calling
        functions: AI_GIRLFRIEND_FUNCTIONS,
        function_call: "auto"
      };

      // 如果有会话ID，添加到metadata
      if (sessionIdParam) {
        options.metadata = {
          session_id: sessionIdParam
        };
      }

      // 发送流式消息
      let accumulatedContent = '';
      let accumulatedReasoningContent = '';
      
      const response = await sender.sendChatMessageStream(
        chatMessages,
        options,
        (chunk: any) => {
          
          console.log('📦 收到流消息 chunk:', chunk);
          
          if (chunk.choices && chunk.choices[0]) {
            const choice = chunk.choices[0];

            // console.log('🎯 处理 choice:', {
            //   delta: choice.delta,
            //   finishReason: choice.finishReason,
            //   message: choice.message,
            //   fullChoice: choice
            // });

            if ( choice.delta && choice.delta.function_call) {
              console.log('🤽‍♂️ FunctionCall:', {
                functionCall: choice.delta.function_call
              });
            }
            
            // 处理函数调用（异步执行，不阻塞流）
            if (choice.delta && choice.delta.function_call) {
              console.log('🔧 检测到函数调用 delta:', choice.delta.function_call);
              
              // 如果函数调用完成
              if (choice.finishReason === 'function_calling' && choice.message && choice.message.function_call) {
                const functionCall = choice.message.function_call;
                console.log('🎯 收到完整的函数调用:', {
                  name: functionCall.name,
                  arguments: functionCall.arguments,
                  parsedArguments: JSON.parse(functionCall.arguments)
                });
                
                // 异步执行，不阻塞流
                functionCallHandler.executeFunctionCall(
                  functionCall.name,
                  JSON.parse(functionCall.arguments)
                ).then(result => {
                  console.log('✅ 函数调用执行结果:', result);
                  
                  // 将函数执行结果添加到消息中
                  setMessageHistory(prev => {
                    const newHistory = { ...prev };
                    const currentMessages = newHistory[currentConversation] || [];
                    const lastMessage = currentMessages[currentMessages.length - 1];
                    
                    if (lastMessage && lastMessage.role === 'assistant') {
                      lastMessage.content += `\n\n${result}`;
                    }
                    
                    return newHistory;
                  });
                }).catch(error => {
                  console.error('❌ 执行函数调用失败:', error);
                });
              }
            }
            
            // 处理文本内容（包括普通内容和思考内容）
            if (choice.delta) {
              // 累积内容
              if (choice.delta.content) {
                accumulatedContent += choice.delta.content;
              }
              
              // 累积思考内容
              if (choice.delta.reasoning_content) {
                accumulatedReasoningContent += choice.delta.reasoning_content;
              }
              
              // 更新消息状态
              setMessageHistory(prev => {
                const currentMessages = prev[currentConversation] || [];
                const updatedMessages = [...currentMessages];
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                
                if (lastMessage && lastMessage.role === 'assistant') {
                  // 创建新的消息对象（保持不可变性）
                  updatedMessages[updatedMessages.length - 1] = {
                    ...lastMessage,
                    content: accumulatedContent,
                    reasoning_content: accumulatedReasoningContent
                  };
                  
                  // 检查 finishReason 并添加提示
                  const finishReason = choice.finishReason;
                  if (finishReason === 'length') {
                    updatedMessages[updatedMessages.length - 1].content += '\n\n⚠️ *回答因长度限制被截断，可能需要继续对话*';
                  } else if (finishReason === 'function_calling') {
                    updatedMessages[updatedMessages.length - 1].content += '\n\n🔧 *回答因函数调用被中断*';
                  }
                }
                
                return {
                  ...prev,
                  [currentConversation]: updatedMessages
                };
              });
            }

            if ( typeof choice.finishReason !== 'undefined') {
              console.log('🤽‍♂️ FinishReason:', {
                finishReason: choice.finishReason
              });
            }
            
            // 调试：检查每个choice的状态
            // console.log('🔍 Choice状态检查:', {
            //   hasFinishReason: !!choice.finishReason,
            //   finishReason: choice.finishReason,
            //   hasDelta: !!choice.delta,
            //   hasMessage: !!choice.message
            // });
            
          }
        },
        async (result: { finishReason: string; fullContent: string }) => {
          console.log('🏁 消息流完成:', {
            finishReason: result.finishReason,
            fullContent: result.fullContent,
            messageId: assistantMessage.id
          });
          
          // 在完成时处理所有格式的 function calling（避免重复执行）
          if (!functionCallsProcessed) {
            functionCallsProcessed = true;
            await processFunctionCalls(result.fullContent);
          }
        }
      );

      console.log('✅ 消息发送成功:', response);

    } catch (error: any) {
      console.error('❌ 消息发送失败:', error);
      
      // 检查是否是用户主动取消
      if (error.name === 'AbortError') {
        setMessageHistory(prev => {
          const newHistory = { ...prev };
          const currentMessages = newHistory[currentConversation] || [];
          const lastMessage = currentMessages[currentMessages.length - 1];
          
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = '对话已取消';
          }
          
          return newHistory;
        });
      } else {
        setMessageHistory(prev => {
          const newHistory = { ...prev };
          const currentMessages = newHistory[currentConversation] || [];
          const lastMessage = currentMessages[currentMessages.length - 1];
          
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = '抱歉，消息发送失败，请稍后重试。';
          }
          
          return newHistory;
        });
      }
    } finally {
      setLoading(false);
      abortController.current = null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userInput = inputValue.trim();
    setInputValue(''); // 清空输入框

    const currentConv = conversations.find(c => c.key === currentConversation);
    if (!currentConv) return;

    // 调用核心发送逻辑
    await sendToAI(userInput, currentConv.systemContext, currentConv.sessionId);
  };

  // ==================== 渲染 ====================
  const currentMessages = useMemo(() => {
    return messageHistory[currentConversation] || [];
  }, [messageHistory, currentConversation]);

  const chatSider = (
    <div className="sider">
      {/* Logo */}
      <div className="logo">
        <span>AI Assistant (๑•̀ㅂ•́)و✧</span>
      </div>

      {/* 新建会话按钮 */}
      <Button
        onClick={createNewConversation}
        type="link"
        className="addBtn"
        icon={<PlusOutlined />}
      >
        New Conversation
      </Button>

      {/* 会话列表 */}
      <Conversations
        items={conversations}
        className="conversations"
        activeKey={currentConversation}
        onActiveChange={switchConversation}
        groupable
        styles={{ item: { padding: '0 8px' } }}
        menu={(conversation) => ({
          items: [
            {
              label: 'Rename',
              key: 'rename',
              icon: <EditOutlined />,
            },
            {
              label: 'Delete',
              key: 'delete',
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => deleteConversation(conversation.key),
            },
          ],
        })}
      />
    </div>
  );

  const chatContent = (
    <div className="chat">
      {/* 消息列表 */}
      <div className="chatList">
        {currentMessages.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto', padding: '16px' }}>
            {currentMessages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: '12px',
                  // maxWidth: '80%',
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: message.role === 'user' ? '#1890ff' : '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    color: message.role === 'user' ? 'white' : '#666',
                    flexShrink: 0
                  }}
                >
                  {message.role === 'user' ? '👤' : '🤖'}
                </div>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#999',
                      fontWeight: 600
                    }}
                  >
                    {message.role === 'user' ? '你' : 'AI助手'}
                  </div>
                  
                  {/* 思考过程 */}
                  {showReasoning && message.reasoning_content && message.reasoning_content.trim() && (
                    <div
                      style={{
                        backgroundColor: '#f6f8fa',
                        border: '1px solid #e1e4e8',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        marginBottom: '4px',
                        fontSize: '12px',
                        color: '#586069',
                        fontStyle: 'italic'
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>🧠 Reasoning:</div>
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                        {message.reasoning_content}
                      </div>
                    </div>
                  )}
                  
                  {/* 主要内容 */}
                  <div
                    style={{
                      backgroundColor: message.role === 'user' ? '#1890ff' : '#f0f0f0',
                      color: message.role === 'user' ? 'white' : '#333',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {filterMessageContent(message.content)}
                  </div>
                  
                  {/* 操作按钮 */}
                  {message.role === 'assistant' && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      <Button type="text" size="small" icon={<ReloadOutlined />} />
                      <Button type="text" size="small" icon={<CopyOutlined />} />
                      <Button type="text" size="small" icon={<LikeOutlined />} />
                      <Button type="text" size="small" icon={<DislikeOutlined />} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="placeholder">
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ color: '#999' }}>
                👋 Hello! I'm your AI assistant
              </Title>
              <p style={{ color: '#999', fontSize: '14px' }}>
                Let's start our conversation!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 发送器 */}
      <div className="sender" ref={senderRef}>
        {/* 思考过程和函数调用控制 */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', gap: '28px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showReasoning}
                onChange={(e) => setShowReasoning(e.target.checked)}
                disabled={loading}
              />
              <span style={{ fontSize: '14px', color: '#666' }}>Show Reasoning</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showFunctionCalls}
                onChange={(e) => setShowFunctionCalls(e.target.checked)}
                disabled={loading}
              />
              <span style={{ fontSize: '14px', color: '#666' }}>Show Function Calls</span>
            </label>
          </div>
        </div>
        
        <Sender
          value={inputValue}
          onChange={(value) => setInputValue(value)}
          onSubmit={handleSendMessage}
          onCancel={() => {
            console.log('onCancel');
            abortController.current?.abort();
          }}
          placeholder="Enter message content..."
          // disabled={!sender}
          loading={loading}
          autoSize={{ minRows: 2, maxRows: 6 }}
          // allowSpeech
        />
      </div>
    </div>
  );

  return (
    <Splitter style={{ height: 'calc(100vh - 66px - 32px)', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
      <Splitter.Panel defaultSize="30%" min="20%" max="70%">
        {chatSider}
      </Splitter.Panel>
      <Splitter.Panel>
        {chatContent}
      </Splitter.Panel>
    </Splitter>
  );
};

export default App;