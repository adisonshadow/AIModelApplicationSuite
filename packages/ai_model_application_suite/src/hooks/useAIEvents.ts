import { useState, useEffect, useCallback, useRef } from 'react';
import { AIEventManager, AIEventType, AIEventData, ConversationState } from '../utils/AIEventManager';

// Hook返回类型
export interface UseAIEventsReturn {
  // 当前对话状态
  currentConversation: ConversationState | null;
  // 所有对话
  conversations: ConversationState[];
  // 对话统计
  stats: {
    totalConversations: number;
    activeConversations: number;
    streamingConversations: number;
    totalMessages: number;
  };
  // 开始新对话
  startConversation: () => string;
  // 停止当前对话
  stopConversation: () => void;
  // 清除对话
  clearConversation: (conversationId?: string) => void;
  // 发送消息
  sendMessage: (message: string) => void;
  // 接收消息
  receiveMessage: (message: string) => void;
  // 开始流式响应
  startStream: () => void;
  // 取消流式响应
  cancelStream: () => void;
  // 处理错误
  handleError: (error: Error, context?: string) => void;
  // 订阅事件
  subscribe: (eventType: AIEventType, listener: (event: AIEventData) => void) => () => void;
}

// AI事件Hook
export function useAIEvents(): UseAIEventsReturn {
  const [currentConversation, setCurrentConversation] = useState<ConversationState | null>(null);
  const [conversations, setConversations] = useState<ConversationState[]>([]);
  const [stats, setStats] = useState({
    totalConversations: 0,
    activeConversations: 0,
    streamingConversations: 0,
    totalMessages: 0
  });

  const managerRef = useRef<AIEventManager | null>(null);
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // 初始化管理器
  useEffect(() => {
    const manager = AIEventManager.getInstance();
    managerRef.current = manager;

    // 获取初始状态
    setCurrentConversation(manager.getCurrentConversation());
    setConversations(manager.getAllConversations());
    setStats(manager.getConversationStats());

    // 订阅事件
    const unsubscribeConversationStarted = manager.subscribe('conversationStarted', () => {
      setCurrentConversation(manager.getCurrentConversation());
      setConversations(manager.getAllConversations());
      setStats(manager.getConversationStats());
    });

    const unsubscribeConversationStopped = manager.subscribe('conversationStopped', () => {
      setCurrentConversation(manager.getCurrentConversation());
      setConversations(manager.getAllConversations());
      setStats(manager.getConversationStats());
    });

    const unsubscribeConversationCleared = manager.subscribe('conversationCleared', () => {
      setCurrentConversation(manager.getCurrentConversation());
      setConversations(manager.getAllConversations());
      setStats(manager.getConversationStats());
    });

    const unsubscribeMessageSent = manager.subscribe('messageSent', () => {
      setStats(manager.getConversationStats());
    });

    const unsubscribeMessageReceived = manager.subscribe('messageReceived', () => {
      setStats(manager.getConversationStats());
    });

    const unsubscribeStreamStarted = manager.subscribe('streamStarted', () => {
      setCurrentConversation(manager.getCurrentConversation());
      setStats(manager.getConversationStats());
    });

    const unsubscribeStreamStopped = manager.subscribe('streamStopped', () => {
      setCurrentConversation(manager.getCurrentConversation());
      setStats(manager.getConversationStats());
    });

    // 保存取消订阅函数
    unsubscribeRefs.current = [
      unsubscribeConversationStarted,
      unsubscribeConversationStopped,
      unsubscribeConversationCleared,
      unsubscribeMessageSent,
      unsubscribeMessageReceived,
      unsubscribeStreamStarted,
      unsubscribeStreamStopped
    ];

    // 清理函数
    return () => {
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // 开始新对话
  const startConversation = useCallback(() => {
    if (!managerRef.current) return '';
    return managerRef.current.startConversation();
  }, []);

  // 停止当前对话
  const stopConversation = useCallback(() => {
    if (!managerRef.current) return;
    managerRef.current.stopConversation();
  }, []);

  // 清除对话
  const clearConversation = useCallback((conversationId?: string) => {
    if (!managerRef.current) return;
    managerRef.current.clearConversation(conversationId);
  }, []);

  // 发送消息
  const sendMessage = useCallback((message: string) => {
    if (!managerRef.current) return;
    managerRef.current.sendMessage(message);
  }, []);

  // 接收消息
  const receiveMessage = useCallback((message: string) => {
    if (!managerRef.current) return;
    managerRef.current.receiveMessage(message);
  }, []);

  // 开始流式响应
  const startStream = useCallback(() => {
    if (!managerRef.current) return;
    managerRef.current.startStream();
  }, []);

  // 取消流式响应
  const cancelStream = useCallback(() => {
    if (!managerRef.current) return;
    managerRef.current.cancelStream();
  }, []);

  // 处理错误
  const handleError = useCallback((error: Error, context?: string) => {
    if (!managerRef.current) return;
    managerRef.current.handleError(error, context);
  }, []);

  // 订阅事件
  const subscribe = useCallback((eventType: AIEventType, listener: (event: AIEventData) => void) => {
    if (!managerRef.current) return () => {};
    return managerRef.current.subscribe(eventType, listener);
  }, []);

  return {
    currentConversation,
    conversations,
    stats,
    startConversation,
    stopConversation,
    clearConversation,
    sendMessage,
    receiveMessage,
    startStream,
    cancelStream,
    handleError,
    subscribe
  };
}

// 简化的对话Hook
export function useConversation(): {
  currentConversation: ConversationState | null;
  isActive: boolean;
  isStreaming: boolean;
  messageCount: number;
  startConversation: () => string;
  stopConversation: () => void;
  clearConversation: () => void;
} {
  const { 
    currentConversation, 
    startConversation, 
    stopConversation, 
    clearConversation 
  } = useAIEvents();

  return {
    currentConversation,
    isActive: currentConversation?.isActive || false,
    isStreaming: currentConversation?.isStreaming || false,
    messageCount: currentConversation?.messageCount || 0,
    startConversation,
    stopConversation,
    clearConversation: () => clearConversation()
  };
}

// 流式响应Hook
export function useStreaming(): {
  isStreaming: boolean;
  startStream: () => void;
  cancelStream: () => void;
} {
  const { currentConversation, startStream, cancelStream } = useAIEvents();

  return {
    isStreaming: currentConversation?.isStreaming || false,
    startStream,
    cancelStream
  };
}
