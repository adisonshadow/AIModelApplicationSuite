import { AutoContinueState, ChatMessage, SendOptions } from '../types';

/**
 * 自动继续管理器
 * 处理AI响应中断时的自动继续逻辑和去重复合成
 */
export class AutoContinueManager {
  private static instance: AutoContinueManager | null = null;
  private currentState: AutoContinueState | null = null;

  public static getInstance(): AutoContinueManager {
    if (!AutoContinueManager.instance) {
      AutoContinueManager.instance = new AutoContinueManager();
    }
    return AutoContinueManager.instance;
  }

  /**
   * 初始化自动继续状态
   */
  public initializeAutoContinue(options?: SendOptions): AutoContinueState | null {
    if (!options?.autoContinue) {
      this.currentState = null;
      return null;
    }

    this.currentState = {
      isActive: true,
      currentAttempt: 0,
      maxAttempts: options.maxAutoContinue || 3,
      accumulatedContent: '',
      isInterrupted: false,
    };

    console.log('🔄 自动继续功能已启用', {
      maxAttempts: this.currentState.maxAttempts,
      options
    });

    return this.currentState;
  }

  /**
   * 检查响应是否被中断
   */
  public isResponseInterrupted(response: any): boolean {
    if (!this.currentState?.isActive) return false;

    // 检查finishReason是否为length（表示因长度限制中断）
    const finishReason = response.choices?.[0]?.finishReason;
    const isLengthLimit = finishReason === 'length' || finishReason === 'max_tokens';
    
    // 检查内容是否看起来被截断
    const content = this.extractContent(response);
    const isTruncated = this.detectTruncation(content);

    const interrupted = isLengthLimit || isTruncated;
    
    if (interrupted) {
      console.log('⚠️ 检测到响应中断', {
        finishReason,
        isTruncated,
        contentLength: content.length,
        content: content.slice(-100) // 显示最后100个字符
      });
    }

    return interrupted;
  }

  /**
   * 提取响应内容
   */
  private extractContent(response: any): string {
    if (response.choices?.[0]?.message?.content) {
      return response.choices[0].message.content;
    }
    if (response.choices?.[0]?.delta?.content) {
      return response.choices[0].delta.content;
    }
    return '';
  }

  /**
   * 检测内容是否被截断
   */
  private detectTruncation(content: string): boolean {
    if (!content) return false;

    // 检查是否以常见的截断模式结尾
    const truncationPatterns = [
      /\.\.\.$/,  // 以...结尾
      /，$/,      // 以中文逗号结尾
      /,$/,       // 以英文逗号结尾
      /：$/,      // 以中文冒号结尾
      /:$/,       // 以英文冒号结尾
      /；$/,      // 以中文分号结尾
      /;$/,       // 以英文分号结尾
      /\s+$/,     // 以空白字符结尾（可能是未完成的句子）
    ];

    return truncationPatterns.some(pattern => pattern.test(content.trim()));
  }

  /**
   * 合并响应内容，去除重复部分
   */
  public mergeResponseContent(newContent: string): string {
    if (!this.currentState) {
      return newContent;
    }

    const accumulated = this.currentState.accumulatedContent;
    
    // 如果没有累积内容，直接返回新内容
    if (!accumulated) {
      this.currentState.accumulatedContent = newContent;
      return newContent;
    }

    // 去重复逻辑：检查新内容是否包含在累积内容中
    const mergedContent = this.deduplicateContent(accumulated, newContent);
    this.currentState.accumulatedContent = mergedContent;

    console.log('🔗 合并响应内容', {
      originalLength: accumulated.length,
      newLength: newContent.length,
      mergedLength: mergedContent.length,
      overlapDetected: mergedContent.length < accumulated.length + newContent.length
    });

    return mergedContent;
  }

  /**
   * 去重复内容合并
   */
  private deduplicateContent(original: string, newContent: string): string {
    // 简单的去重复策略：检查新内容的开头是否与原文的结尾重复
    const minOverlapLength = Math.min(50, Math.floor(newContent.length * 0.3));
    
    for (let overlapLength = minOverlapLength; overlapLength > 0; overlapLength--) {
      const originalEnd = original.slice(-overlapLength);
      const newStart = newContent.slice(0, overlapLength);
      
      if (originalEnd === newStart) {
        console.log('🔄 检测到内容重叠，去除重复部分', {
          overlapLength,
          overlapContent: originalEnd
        });
        return original + newContent.slice(overlapLength);
      }
    }

    // 如果没有检测到重叠，直接拼接
    return original + newContent;
  }

  /**
   * 生成继续请求的消息
   */
  public generateContinueMessage(originalMessages: ChatMessage[], accumulatedContent: string): ChatMessage[] {
    // 添加AI已经回答的部分作为assistant消息
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: accumulatedContent
    };

    // 添加继续请求
    const continueMessage: ChatMessage = {
      role: 'user',
      content: '请继续完成上述回答，从上次中断的地方继续。'
    };

    console.log('🔄 生成继续请求消息', {
      originalMessagesCount: originalMessages.length,
      accumulatedContentLength: accumulatedContent.length,
      accumulatedContentPreview: accumulatedContent.slice(-100) // 显示最后100个字符
    });

    // 返回原始消息 + AI已回答部分 + 继续请求
    return [...originalMessages, assistantMessage, continueMessage];
  }

  /**
   * 检查是否可以继续
   */
  public canContinue(): boolean {
    if (!this.currentState?.isActive) return false;
    return this.currentState.currentAttempt < this.currentState.maxAttempts;
  }

  /**
   * 增加尝试次数
   */
  public incrementAttempt(): void {
    if (this.currentState) {
      this.currentState.currentAttempt++;
      console.log('📈 自动继续尝试次数', {
        current: this.currentState.currentAttempt,
        max: this.currentState.maxAttempts
      });
    }
  }

  /**
   * 完成自动继续
   */
  public completeAutoContinue(): string {
    if (!this.currentState) return '';

    const finalContent = this.currentState.accumulatedContent;
    console.log('✅ 自动继续完成', {
      totalAttempts: this.currentState.currentAttempt,
      finalContentLength: finalContent.length
    });

    this.currentState = null;
    return finalContent;
  }

  /**
   * 获取当前状态
   */
  public getCurrentState(): AutoContinueState | null {
    return this.currentState;
  }

  /**
   * 重置状态
   */
  public reset(): void {
    this.currentState = null;
  }
}
