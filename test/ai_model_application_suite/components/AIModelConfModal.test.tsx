import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIModelConfModal } from '../../../packages/ai_model_application_suite/src/components/AIModelConfModal';
import { AIProvider, AIProviderMeta } from '../../../packages/ai_model_application_suite/src/types';

const mockProviders: AIProviderMeta[] = [
  {
    id: AIProvider.OPENAI,
    name: 'OpenAI',
    description: 'OpenAI GPT models',
    requiresApiKey: true,
    defaultBaseURL: 'https://api.openai.com/v1',
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'sk-...'
      }
    ]
  },
  {
    id: AIProvider.VOLCENGINE,
    name: 'Volcengine',
    description: 'Volcengine AI models',
    requiresApiKey: true,
    defaultBaseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: ''
      },
      {
        key: 'model',
        label: 'AI模型',
        type: 'autocomplete',
        required: true,
        placeholder: '输入或选择AI模型',
        suggestions: ['gpt-4', 'gpt-3.5-turbo']
      }
    ]
  }
];

describe('AIModelConfModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    supportedProviders: mockProviders
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染弹窗', () => {
    render(<AIModelConfModal {...defaultProps} />);
    
    expect(screen.getByText('添加AI模型')).toBeInTheDocument();
    expect(screen.getByText('AI提供商')).toBeInTheDocument();
    expect(screen.getByText('配置名称')).toBeInTheDocument();
    expect(screen.getByText('启用状态')).toBeInTheDocument();
  });

  it('应该显示编辑模式标题', () => {
    const editingModel = {
      id: 'test-id',
      name: '测试模型',
      provider: AIProvider.OPENAI,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      config: { apiKey: 'test-key' }
    };

    render(<AIModelConfModal {...defaultProps} editingModel={editingModel} />);
    
    expect(screen.getByText('编辑AI模型')).toBeInTheDocument();
  });

  it('应该支持关闭弹窗', () => {
    const onClose = jest.fn();
    render(<AIModelConfModal {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('应该支持ESC键关闭弹窗', () => {
    const onClose = jest.fn();
    render(<AIModelConfModal {...defaultProps} onClose={onClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('应该支持Ctrl+Enter保存', async () => {
    const onSave = jest.fn();
    render(<AIModelConfModal {...defaultProps} onSave={onSave} />);
    
    // 填写表单
    const nameInput = screen.getByLabelText('配置名称');
    fireEvent.change(nameInput, { target: { value: '测试配置' } });
    
    fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true });
    
    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });

  it('应该验证必填字段', async () => {
    const onSave = jest.fn();
    render(<AIModelConfModal {...defaultProps} onSave={onSave} />);
    
    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);
    
    expect(screen.getByText('配置名称不能为空')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('应该支持提供商选择', () => {
    render(<AIModelConfModal {...defaultProps} />);
    
    const providerSelect = screen.getByLabelText('AI提供商');
    expect(providerSelect).toBeInTheDocument();
    
    // 检查提供商选项
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Volcengine')).toBeInTheDocument();
  });

  it('应该根据选择的提供商显示不同的配置字段', () => {
    render(<AIModelConfModal {...defaultProps} />);
    
    const providerSelect = screen.getByLabelText('AI提供商');
    fireEvent.change(providerSelect, { target: { value: AIProvider.VOLCENGINE } });
    
    // 应该显示Volcengine特有的字段
    expect(screen.getByText('AI模型')).toBeInTheDocument();
  });

  it('应该支持JSON参数折叠/展开', () => {
    render(<AIModelConfModal {...defaultProps} />);
    
    const toggleButton = screen.getByTitle('点击展开');
    expect(toggleButton).toBeInTheDocument();
    
    fireEvent.click(toggleButton);
    
    expect(screen.getByTitle('点击折叠')).toBeInTheDocument();
  });

  it('应该支持JSON格式化', () => {
    render(<AIModelConfModal {...defaultProps} />);
    
    // 展开JSON参数区域
    const toggleButton = screen.getByTitle('点击展开');
    fireEvent.click(toggleButton);
    
    const formatButton = screen.getByText('🔧 格式化JSON');
    expect(formatButton).toBeInTheDocument();
  });

  it('应该支持JSON验证', () => {
    render(<AIModelConfModal {...defaultProps} />);
    
    // 展开JSON参数区域
    const toggleButton = screen.getByTitle('点击展开');
    fireEvent.click(toggleButton);
    
    const validateButton = screen.getByText('✅ 验证JSON');
    expect(validateButton).toBeInTheDocument();
  });

  it('应该支持启用/禁用切换', () => {
    render(<AIModelConfModal {...defaultProps} />);
    
    const enabledSwitch = screen.getByLabelText('启用状态');
    expect(enabledSwitch).toBeInTheDocument();
    
    fireEvent.click(enabledSwitch);
    
    expect(screen.getByText('已禁用')).toBeInTheDocument();
  });

  it('应该支持自定义样式类名', () => {
    const customClass = 'custom-modal';
    const { container } = render(
      <AIModelConfModal {...defaultProps} className={customClass} />
    );
    
    expect(container.querySelector('.ai-modal')).toHaveClass(customClass);
  });

  it('应该支持内联样式', () => {
    const customStyle = { backgroundColor: 'red' };
    const { container } = render(
      <AIModelConfModal {...defaultProps} style={customStyle} />
    );
    
    expect(container.querySelector('.ai-modal')).toHaveStyle('background-color: red');
  });

  it('应该支持显示管理配置按钮', () => {
    const onShowManager = jest.fn();
    render(<AIModelConfModal {...defaultProps} onShowManager={onShowManager} />);
    
    const managerButton = screen.getByText('管理配置');
    expect(managerButton).toBeInTheDocument();
    
    fireEvent.click(managerButton);
    expect(onShowManager).toHaveBeenCalledTimes(1);
  });

  it('应该正确处理保存状态', async () => {
    const onSave = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<AIModelConfModal {...defaultProps} onSave={onSave} />);
    
    // 填写表单
    const nameInput = screen.getByLabelText('配置名称');
    fireEvent.change(nameInput, { target: { value: '测试配置' } });
    
    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);
    
    expect(screen.getByText('保存中...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });
});
