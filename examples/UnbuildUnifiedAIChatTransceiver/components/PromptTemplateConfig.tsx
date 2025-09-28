// 提示词模板接口
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

// 内置提示词模板
export const promptTemplates: PromptTemplate[] = [
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
    id: 'custom',
    name: '自定义提示词',
    description: '使用自定义的提示词',
    prompt: ''
  }
];

// 提示词模板处理器
export class PromptTemplateProcessor {
  /**
   * 根据模板ID获取提示词内容
   * @param templateId 模板ID
   * @param customPrompt 自定义提示词
   * @returns 提示词内容
   */
  static getPromptContent(templateId: string, customPrompt: string = ''): string {
    if (templateId === 'custom') {
      return customPrompt;
    }
    
    const template = promptTemplates.find(t => t.id === templateId);
    return template?.prompt || '';
  }

  /**
   * 检查是否有有效的提示词模板
   * @param templateId 模板ID
   * @param customPrompt 自定义提示词
   * @returns 是否有有效提示词
   */
  static hasValidPrompt(templateId: string, customPrompt: string = ''): boolean {
    const content = this.getPromptContent(templateId, customPrompt);
    return content.trim().length > 0;
  }
}
