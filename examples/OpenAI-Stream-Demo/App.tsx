import React, { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';
import './App.css';

// 扩展OpenAI的类型定义以支持reasoning_content
interface ExtendedDelta {
  content?: string;
  reasoning_content?: string;
  role?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  reasoning_content?: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showReasoning, setShowReasoning] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 配置 OpenAI 客户端连接火山引擎
  const client = new OpenAI({
    apiKey: '7-xxxx',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    dangerouslyAllowBrowser: true, // 注意：生产环境应该使用后端代理
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // 创建一个空的 assistant 消息
    const assistantMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '', reasoning_content: '' }]);

    try {
      abortControllerRef.current = new AbortController();

      const stream = await client.chat.completions.create({
        model: 'doubao-seed-1-6-250615',
        messages: [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        stream: true,
      });

      let fullContent = '';
      let fullReasoningContent = '';

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta as ExtendedDelta;
        const content = delta?.content || '';
        const reasoningContent = delta?.reasoning_content || '';
        
        fullContent += content;
        fullReasoningContent += reasoningContent;

        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[assistantMessageIndex] = {
            role: 'assistant',
            content: fullContent,
            reasoning_content: fullReasoningContent,
          };
          return newMessages;
        });
      }
    } catch (error: any) {
      console.error('流式请求错误:', error);
      if (error.name !== 'AbortError') {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[assistantMessageIndex] = {
            role: 'assistant',
            content: `错误: ${error.message}`,
            reasoning_content: '',
          };
          return newMessages;
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleClear = () => {
    if (!isStreaming) {
      setMessages([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app-container">

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p>Let's start the conversation! (Note: Configure the apiKey and Modal)</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-avatar">
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-role">
                  {message.role === 'user' ? 'User' : 'Assistant'}
                </div>
                {showReasoning && message.reasoning_content && message.reasoning_content.trim() && (
                  <div className="reasoning-content">
                    <div className="reasoning-label">🧠 Reasoning Process:</div>
                    <div className="reasoning-text">{message.reasoning_content}</div>
                  </div>
                )}
                <div className="message-text">
                  {message.content || (isStreaming && index === messages.length - 1 ? '思考中...' : '')}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter your message... (Enter to send, Shift+Enter to newline)"
            disabled={isStreaming}
            rows={3}
          />
          <div className="button-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showReasoning}
                onChange={(e) => setShowReasoning(e.target.checked)}
              />
              Show Reasoning Process
            </label>
            <button
              onClick={handleClear}
              disabled={isStreaming || messages.length === 0}
              className="btn-clear"
            >
              Clear
            </button>
            {isStreaming ? (
              <button onClick={handleStop} className="btn-stop">
                Stop
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="btn-send"
              >
                Send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


