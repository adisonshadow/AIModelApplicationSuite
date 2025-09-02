import React from 'react';
import { promptTemplates, PromptTemplateProcessor, type PromptTemplate } from './PromptTemplateConfig';

interface PromptTemplateComponentProps {
  selectedTemplate: string;
  customPrompt: string;
  onTemplateChange: (templateId: string) => void;
  onCustomPromptChange: (prompt: string) => void;
}

export const PromptTemplateComponent: React.FC<PromptTemplateComponentProps> = ({
  selectedTemplate,
  customPrompt,
  onTemplateChange,
  onCustomPromptChange
}) => {
  return (
    <div className="sidebar-section">
      <h3>🎭 开发用提示词追加</h3>
      <div className="prompt-templates">
        <div className="template-selector">
          <select
            value={selectedTemplate}
            onChange={(e) => {
              onTemplateChange(e.target.value);
              if (e.target.value !== 'custom') {
                const template = promptTemplates.find(t => t.id === e.target.value);
                onCustomPromptChange(template?.prompt || '');
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
        
        {selectedTemplate === 'custom' && (
          <div className="custom-prompt">
            <label>自定义提示词:</label>
            <textarea
              value={customPrompt}
              onChange={(e) => onCustomPromptChange(e.target.value)}
              placeholder="输入自定义提示词..."
              rows={3}
              className="custom-prompt-input"
            />
          </div>
        )}
        
        {selectedTemplate && (
          <div className="template-preview">
            <small>
              <strong>当前模板:</strong> {promptTemplates.find(t => t.id === selectedTemplate)?.name}
            </small>
            <div className="template-content">
              {PromptTemplateProcessor.getPromptContent(selectedTemplate, customPrompt)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
