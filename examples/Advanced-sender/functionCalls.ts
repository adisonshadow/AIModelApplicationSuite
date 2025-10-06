// AI女友动作函数定义
export interface FunctionCall {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

// 定义AI女友可以执行的动作函数
export const AI_GIRLFRIEND_FUNCTIONS: FunctionCall[] = [
  {
    name: "shake_sender",
    description: "摇晃发送器，表达撒娇或不满的情绪",
    parameters: {
      type: "object",
      properties: {
        intensity: {
          type: "string",
          enum: ["gentle", "medium", "strong"],
          description: "摇晃强度：gentle(轻柔)、medium(中等)、strong(强烈)"
        },
        reason: {
          type: "string",
          description: "摇晃的原因，比如撒娇、不满、兴奋等"
        }
      },
      required: ["intensity", "reason"]
    }
  },
  {
    name: "screen_flash",
    description: "屏幕闪烁效果，表达惊讶、兴奋或强调",
    parameters: {
      type: "object",
      properties: {
        color: {
          type: "string",
          enum: ["pink", "blue", "yellow", "green", "purple"],
          description: "闪烁颜色"
        },
        duration: {
          type: "number",
          minimum: 1,
          maximum: 5,
          description: "闪烁持续时间（秒）"
        },
        reason: {
          type: "string",
          description: "闪烁的原因，比如惊讶、兴奋、强调等"
        }
      },
      required: ["color", "duration", "reason"]
    }
  },
  {
    name: "show_message",
    description: "显示弹窗消息，表达各种情绪和想法",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["success", "info", "warning", "error", "loading"],
          description: "消息类型：success(成功)、info(信息)、warning(警告)、error(错误)、loading(加载中)"
        },
        content: {
          type: "string",
          description: "消息内容"
        },
        duration: {
          type: "number",
          minimum: 1,
          maximum: 15,
          description: "显示持续时间（秒），0表示不自动关闭"
        },
        position: {
          type: "string",
          enum: ["top", "topLeft", "topRight", "bottom", "bottomLeft", "bottomRight"],
          description: "消息显示位置，默认为top"
        },
        style: {
          type: "object",
          description: "自定义样式对象，包含CSS属性"
        }
      },
      required: ["type", "content", "duration"]
    }
  },
  {
    name: "play_sound_effect",
    description: "播放音效，增强互动体验",
    parameters: {
      type: "object",
      properties: {
        sound: {
          type: "string",
          enum: ["kiss", "heart", "bell", "pop", "ding"],
          description: "音效类型"
        },
        volume: {
          type: "number",
          minimum: 0.1,
          maximum: 1.0,
          description: "音量大小"
        },
        reason: {
          type: "string",
          description: "播放音效的原因"
        }
      },
      required: ["sound", "volume", "reason"]
    }
  },
  {
    name: "flash_bg",
    description: "闪烁聊天区域的背景颜色，表达不同情绪",
    parameters: {
      type: "object",
      properties: {
        color: {
          type: "string",
          enum: ["pink", "blue", "yellow", "green", "purple", "red", "orange", "cyan"],
          description: "闪烁的背景颜色"
        },
        duration: {
          type: "number",
          minimum: 1,
          maximum: 5,
          description: "闪烁持续时间（秒）"
        },
        intensity: {
          type: "string",
          enum: ["gentle", "medium", "strong"],
          description: "闪烁强度：gentle(轻柔)、medium(中等)、strong(强烈)"
        },
        reason: {
          type: "string",
          description: "闪烁背景的原因，比如兴奋、惊讶、强调等"
        }
      },
      required: ["color", "duration", "intensity", "reason"]
    }
  }
];

// 执行函数调用的处理器
export class FunctionCallHandler {
  private onShakeSender?: (intensity: string, reason: string) => void;
  private onScreenFlash?: (color: string, duration: number, reason: string) => void;
  private onShowMessage?: (type: string, content: string, duration: number, position?: string, style?: object) => void;
  private onPlaySound?: (sound: string, volume: number, reason: string) => void;
  private onFlashBg?: (color: string, duration: number, intensity: string, reason: string) => void;

  constructor() {
    // 初始化默认处理器
    this.onShowMessage = (type, content, duration) => {
      console.log(`📢 显示消息 [${type}]: ${content} (${duration}秒)`);
    };
  }

  // 设置各种动作的处理器
  setShakeSenderHandler(handler: (intensity: string, reason: string) => void) {
    this.onShakeSender = handler;
  }

  setScreenFlashHandler(handler: (color: string, duration: number, reason: string) => void) {
    this.onScreenFlash = handler;
  }

  setShowMessageHandler(handler: (type: string, content: string, duration: number, position?: string, style?: object) => void) {
    this.onShowMessage = handler;
  }

  setPlaySoundHandler(handler: (sound: string, volume: number, reason: string) => void) {
    this.onPlaySound = handler;
  }

  setFlashBgHandler(handler: (color: string, duration: number, intensity: string, reason: string) => void) {
    this.onFlashBg = handler;
  }

  // 执行函数调用
  async executeFunctionCall(functionName: string, arguments_: any): Promise<string> {
    console.log('🤽‍♂️ FunctionCall:', {
      functionName: functionName,
      arguments: arguments_
    });
    try {
      switch (functionName) {
        case "shake_sender":
          if (this.onShakeSender) {
            // 为缺失的参数提供默认值
            const intensity = arguments_.intensity || 'medium';
            const reason = arguments_.reason || '表达情绪';
            
            this.onShakeSender(intensity, reason);
            const intensityText: Record<string, string> = {
              'gentle': '轻柔地',
              'medium': '适度地',
              'strong': '强烈地'
            };
            return `💫 正在${intensityText[intensity] || '适度地'}摇晃发送器，因为：${reason}`;
          }
          break;

        case "screen_flash":
          if (this.onScreenFlash) {
            // 为缺失的参数提供默认值
            const color = arguments_.color || 'purple';
            const duration = arguments_.duration || 2;
            const reason = arguments_.reason || '增强视觉效果';
            
            this.onScreenFlash(color, duration, reason);
            return `✨ 屏幕${color}色闪烁${duration}秒，因为：${reason}`;
          }
          break;

        case "show_message":
          if (this.onShowMessage) {
            this.onShowMessage(arguments_.type, arguments_.content, arguments_.duration, arguments_.position, arguments_.style);
            return `📢 显示${arguments_.type}消息：${arguments_.content} (${arguments_.duration}秒)`;
          }
          break;

        case "play_sound_effect":
          if (this.onPlaySound) {
            this.onPlaySound(arguments_.sound, arguments_.volume, arguments_.reason);
            return `🔊 播放${arguments_.sound}音效，音量${arguments_.volume}，因为：${arguments_.reason}`;
          }
          break;

        case "flash_bg":
          if (this.onFlashBg) {
            this.onFlashBg(arguments_.color, arguments_.duration, arguments_.intensity, arguments_.reason);
            const intensityText: Record<string, string> = {
              'gentle': '轻柔地',
              'medium': '适度地',
              'strong': '强烈地'
            };
            return `🎨 ${intensityText[arguments_.intensity] || '适度地'}闪烁${arguments_.color}色背景${arguments_.duration}秒，因为：${arguments_.reason}`;
          }
          break;

        default:
          return `❌ 未知的函数调用：${functionName}`;
      }
      
      return `✅ 函数 ${functionName} 执行完成`;
    } catch (error) {
      console.error('执行函数调用失败:', error);
      return `❌ 执行函数 ${functionName} 时出错：${error}`;
    }
  }
}

// 创建全局函数调用处理器实例
export const functionCallHandler = new FunctionCallHandler();
