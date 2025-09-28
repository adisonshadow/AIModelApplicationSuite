import { AIModelConfig } from '../types';

// AI事件类型
export type AIEventType = 
  | 'conversationStarted'
  | 'conversationStopped'
  | 'conversationCleared'
  | 'messageSent'
  | 'messageReceived'
  | 'streamStarted'
  | 'streamStopped'
  | 'error';

// AI事件数据
export interface AIEventData {
  type: AIEventType;
  data?: any;
  error?: Error;
  timestamp: number;
  conversationId?: string;
}

// 事件监听器类型
export type AIEventListener = (event: AIEventData) => void;

// 对话状态
export interface ConversationState {
  id: string;
  isActive: boolean;
  isStreaming: boolean;
  messageCount: number;
  startTime: number;
  lastActivity: number;
}

// AI事件管理器
export class AIEventManager {
  private static instance: AIEventManager | null = null;
  private eventListeners: Map<AIEventType, Set<AIEventListener>> = new Map();
  private conversations: Map<string, ConversationState> = new Map();
  private currentConversationId: string | null = null;

  private constructor() {
    this.setupEventTypes();
  }

  // 获取单例实例
  public static getInstance(): AIEventManager {
    if (!AIEventManager.instance) {
      AIEventManager.instance = new AIEventManager();
    }
    return AIEventManager.instance;
  }

  // 重置单例实例
  public static resetInstance(): void {
    if (AIEventManager.instance) {
      AIEventManager.instance.destroy();
      AIEventManager.instance = null;
    }
  }

  // 设置事件类型
  private setupEventTypes(): void {
    const eventTypes: AIEventType[] = [
      'conversationStarted',
      'conversationStopped',
      'conversationCleared',
      'messageSent',
      'messageReceived',
      'streamStarted',
      'streamStopped',
      'error'
    ];
    
    eventTypes.forEach(type => {
      this.eventListeners.set(type, new Set());
    });
  }

  // 生成对话ID
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 开始新对话
  public startConversation(): string {
    const conversationId = this.generateConversationId();
    
    this.conversations.set(conversationId, {
      id: conversationId,
      isActive: true,
      isStreaming: false,
      messageCount: 0,
      startTime: Date.now(),
      lastActivity: Date.now()
    });
    
    this.currentConversationId = conversationId;
    
    this.emitEvent({
      type: 'conversationStarted',
      data: { conversationId },
      timestamp: Date.now(),
      conversationId
    });
    
    return conversationId;
  }

  // 停止当前对话
  public stopConversation(): void {
    if (!this.currentConversationId) return;
    
    const conversation = this.conversations.get(this.currentConversationId);
    if (conversation) {
      conversation.isActive = false;
      conversation.isStreaming = false;
      conversation.lastActivity = Date.now();
      
      this.emitEvent({
        type: 'conversationStopped',
        data: { conversationId: this.currentConversationId },
        timestamp: Date.now(),
        conversationId: this.currentConversationId
      });
    }
    
    this.currentConversationId = null;
  }

  // 清除对话
  public clearConversation(conversationId?: string): void {
    const targetId = conversationId || this.currentConversationId;
    if (!targetId) return;
    
    this.conversations.delete(targetId);
    
    if (this.currentConversationId === targetId) {
      this.currentConversationId = null;
    }
    
    this.emitEvent({
      type: 'conversationCleared',
      data: { conversationId: targetId },
      timestamp: Date.now(),
      conversationId: targetId
    });
  }

  // 发送消息
  public sendMessage(message: string, modelConfig?: AIModelConfig): void {
    if (!this.currentConversationId) {
      this.startConversation();
    }
    
    const conversation = this.conversations.get(this.currentConversationId!);
    if (conversation) {
      conversation.messageCount++;
      conversation.lastActivity = Date.now();
    }
    
    this.emitEvent({
      type: 'messageSent',
      data: { 
        message, 
        modelConfig,
        conversationId: this.currentConversationId 
      },
      timestamp: Date.now(),
      conversationId: this.currentConversationId!
    });
  }

  // 接收消息
  public receiveMessage(message: string, modelConfig?: AIModelConfig): void {
    if (!this.currentConversationId) return;
    
    const conversation = this.conversations.get(this.currentConversationId);
    if (conversation) {
      conversation.messageCount++;
      conversation.lastActivity = Date.now();
    }
    
    this.emitEvent({
      type: 'messageReceived',
      data: { 
        message, 
        modelConfig,
        conversationId: this.currentConversationId 
      },
      timestamp: Date.now(),
      conversationId: this.currentConversationId
    });
  }

  // 开始流式响应
  public startStream(): void {
    if (!this.currentConversationId) return;
    
    const conversation = this.conversations.get(this.currentConversationId);
    if (conversation) {
      conversation.isStreaming = true;
      conversation.lastActivity = Date.now();
    }
    
    this.emitEvent({
      type: 'streamStarted',
      data: { conversationId: this.currentConversationId },
      timestamp: Date.now(),
      conversationId: this.currentConversationId
    });
  }

  // 取消流式响应
  public cancelStream(): void {
    if (!this.currentConversationId) return;
    
    const conversation = this.conversations.get(this.currentConversationId);
    if (conversation) {
      conversation.isStreaming = false;
      conversation.lastActivity = Date.now();
    }
    
    this.emitEvent({
      type: 'streamStopped',
      data: { conversationId: this.currentConversationId },
      timestamp: Date.now(),
      conversationId: this.currentConversationId
    });
  }

  // 停止流式响应 (弃用，请使用 cancelStream)
  /** @deprecated 请使用 cancelStream 替代，将在 v1.0.0 中移除 */
  public stopStream(): void {
    this.cancelStream();
  }

  // 处理错误
  public handleError(error: Error, context?: string): void {
    this.emitEvent({
      type: 'error',
      data: { context },
      error,
      timestamp: Date.now(),
      conversationId: this.currentConversationId || undefined
    });
  }

  // 订阅事件
  public subscribe(eventType: AIEventType, listener: AIEventListener): () => void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.add(listener);
      
      return () => {
        listeners.delete(listener);
      };
    }
    
    return () => {};
  }

  // 取消订阅
  public unsubscribe(eventType: AIEventType, listener: AIEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // 发送事件
  private emitEvent(event: AIEventData): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`[AIEventManager] Error in event listener for ${event.type}:`, error);
        }
      });
    }
  }

  // 获取当前对话状态
  public getCurrentConversation(): ConversationState | null {
    if (!this.currentConversationId) return null;
    return this.conversations.get(this.currentConversationId) || null;
  }

  // 获取所有对话
  public getAllConversations(): ConversationState[] {
    return Array.from(this.conversations.values());
  }

  // 获取对话统计
  public getConversationStats(): {
    totalConversations: number;
    activeConversations: number;
    streamingConversations: number;
    totalMessages: number;
  } {
    const conversations = Array.from(this.conversations.values());
    
    return {
      totalConversations: conversations.length,
      activeConversations: conversations.filter(c => c.isActive).length,
      streamingConversations: conversations.filter(c => c.isStreaming).length,
      totalMessages: conversations.reduce((sum, c) => sum + c.messageCount, 0)
    };
  }

  // 销毁管理器
  public destroy(): void {
    this.eventListeners.forEach(listeners => listeners.clear());
    this.eventListeners.clear();
    this.conversations.clear();
    this.currentConversationId = null;
  }
}

// 导出便捷的获取实例函数
export const getAIEventManager = (): AIEventManager => {
  return AIEventManager.getInstance();
};

// 导出默认实例
export const aiEventManager = AIEventManager.getInstance();
