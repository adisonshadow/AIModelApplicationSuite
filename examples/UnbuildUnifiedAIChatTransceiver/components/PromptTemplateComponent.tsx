import React from 'react';
import { promptTemplates, PromptTemplateProcessor } from './PromptTemplateConfig';
import { Select } from 'antd';

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
      <h3>🎭 Prompt Template</h3>
      <div className="prompt-templates">
        <div className="template-selector">
          <Select
            value={selectedTemplate || undefined}
            onChange={(value) => {
              onTemplateChange(value || '');
              if (value !== 'custom') {
                const template = promptTemplates.find(t => t.id === value);
                onCustomPromptChange(template?.prompt || '');
              }
            }}
            placeholder="Not using template"
            style={{ width: '100%' }}
            allowClear
          >
            {promptTemplates.map(template => (
              <Select.Option key={template.id} value={template.id}>
                {template.name} - {template.description}
              </Select.Option>
            ))}
          </Select>
        </div>
        
        {selectedTemplate === 'custom' && (
          <div className="custom-prompt">
            <label>Custom Prompt:</label>
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
              <strong>Current Template:</strong> {promptTemplates.find(t => t.id === selectedTemplate)?.name}
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
