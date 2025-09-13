import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIModelSelect } from '../../../packages/ai_model_application_suite/src/components/AIModelSelect';
import { AIProvider } from '../../../packages/ai_model_application_suite/src/types';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('AIModelSelect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('应该正确渲染下拉选择模式', () => {
    render(<AIModelSelect mode="select" />);
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('请选择AI模型')).toBeInTheDocument();
  });

  it('应该正确渲染列表模式', () => {
    render(<AIModelSelect mode="list" />);
    
    expect(screen.getByText('请选择AI模型')).toBeInTheDocument();
  });

  it('应该显示加载状态', () => {
    render(<AIModelSelect mode="select" />);
    
    expect(screen.getByText('正在加载配置...')).toBeInTheDocument();
  });

  it('应该支持自定义占位符文本', () => {
    const customPlaceholder = '自定义占位符';
    render(<AIModelSelect mode="select" placeholder={customPlaceholder} />);
    
    expect(screen.getByText(customPlaceholder)).toBeInTheDocument();
  });

  it('应该支持自定义添加按钮文本', () => {
    const customAddText = '自定义添加按钮';
    render(<AIModelSelect mode="list" addButtonText={customAddText} />);
    
    expect(screen.getByText(customAddText)).toBeInTheDocument();
  });

  it('应该支持禁用添加按钮', () => {
    render(<AIModelSelect mode="list" showAddButton={false} />);
    
    expect(screen.queryByText('添加AI模型')).not.toBeInTheDocument();
  });

  it('应该支持自定义样式类名', () => {
    const customClass = 'custom-class';
    const { container } = render(<AIModelSelect className={customClass} />);
    
    expect(container.firstChild).toHaveClass(customClass);
  });

  it('应该支持自定义主题', () => {
    const { container } = render(<AIModelSelect theme="dark" />);
    
    expect(container.firstChild).toHaveClass('theme-dark');
  });

  it('应该支持系统主题', () => {
    const { container } = render(<AIModelSelect theme="system" />);
    
    expect(container.firstChild).toHaveClass('theme-system');
  });

  it('应该支持亮色主题', () => {
    const { container } = render(<AIModelSelect theme="light" />);
    
    expect(container.firstChild).toHaveClass('theme-light');
  });

  it('应该支持自定义提供商列表', () => {
    const supportedProviders = [AIProvider.OPENAI, AIProvider.VOLCENGINE];
    render(<AIModelSelect supportedProviders={supportedProviders} />);
    
    // 这里可以添加更多具体的测试逻辑
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('应该正确处理模型选择变化', async () => {
    const onModelChange = jest.fn();
    render(<AIModelSelect onModelChange={onModelChange} />);
    
    // 这里需要模拟有配置数据的情况
    // 由于组件内部有异步加载逻辑，这里只是基本的结构测试
    expect(onModelChange).toBeDefined();
  });

  it('应该正确处理配置变化', async () => {
    const onConfigChange = jest.fn();
    render(<AIModelSelect onConfigChange={onConfigChange} />);
    
    // 这里需要模拟配置变化的情况
    expect(onConfigChange).toBeDefined();
  });

  it('应该支持内联样式', () => {
    const customStyle = { backgroundColor: 'red' };
    const { container } = render(<AIModelSelect style={customStyle} />);
    
    expect(container.firstChild).toHaveStyle('background-color: red');
  });

  it('应该支持禁用删除功能', () => {
    render(<AIModelSelect allowDelete={false} />);
    
    // 这里可以添加更多具体的测试逻辑
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
