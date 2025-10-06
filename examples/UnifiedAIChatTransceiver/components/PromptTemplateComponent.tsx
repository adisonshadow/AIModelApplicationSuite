import React from 'react';
import { promptTemplates, PromptTemplateProcessor } from './PromptTemplateConfig';

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
            <option value="">Not using template</option>
            {promptTemplates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name} - {template.description}
              </option>
            ))}
          </select>
        </div>
        
        {selectedTemplate === 'custom' && (
          <div className="custom-prompt">
            <label>Custom Prompt:</label>
            <textarea
              value={customPrompt}
              onChange={(e) => onCustomPromptChange(e.target.value)}
              placeholder="Custom Prompt..."
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
