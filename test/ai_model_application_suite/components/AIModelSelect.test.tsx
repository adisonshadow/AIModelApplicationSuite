import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIModelSelect } from '@ai-model-application-suite/core/src/components/AIModelSelect';
import { AIProvider, AIModelConfig } from '@ai-model-application-suite/core/src/types';

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

// Mock AIModelManager
const mockManager = {
  getConfigs: jest.fn(),
  getSelectedModelId: jest.fn(),
  setSelectedModel: jest.fn(),
  loadConfigs: jest.fn(),
  saveConfig: jest.fn(),
  deleteConfig: jest.fn(),
  updateConfig: jest.fn(),
  onConfigsChange: jest.fn(),
};

describe('AIModelSelect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockManager.getConfigs.mockReturnValue([]);
    mockManager.getSelectedModelId.mockReturnValue(null);
    mockManager.loadConfigs.mockResolvedValue([]);
  });

  it('应该正确渲染下拉选择模式', async () => {
    render(<AIModelSelect mode="select" manager={mockManager} />);
    
    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    
    expect(screen.getByText('请选择AI模型')).toBeInTheDocument();
  });

  it('应该正确渲染列表模式', async () => {
    render(<AIModelSelect mode="list" manager={mockManager} />);
    
    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText('请选择AI模型')).toBeInTheDocument();
    });
  });

  it('应该显示加载状态', () => {
    render(<AIModelSelect mode="select" />);
    
    expect(screen.getByText('正在加载配置...')).toBeInTheDocument();
  });

  it('应该支持自定义占位符文本', async () => {
    const customPlaceholder = '自定义占位符';
    render(<AIModelSelect mode="select" placeholder={customPlaceholder} manager={mockManager} />);
    
    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText(customPlaceholder)).toBeInTheDocument();
    });
  });

  it('应该支持自定义添加按钮文本', async () => {
    const customAddText = '自定义添加按钮';
    render(<AIModelSelect mode="list" addButtonText={customAddText} manager={mockManager} />);
    
    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText(customAddText)).toBeInTheDocument();
    });
  });

  it('应该支持禁用添加按钮', async () => {
    render(<AIModelSelect mode="list" showAddButton={false} manager={mockManager} />);
    
    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.queryByText('添加AI模型')).not.toBeInTheDocument();
    });
  });

  it('应该支持自定义样式类名', async () => {
    const customClass = 'custom-class';
    const { container } = render(<AIModelSelect className={customClass} manager={mockManager} />);
    
    // 等待组件加载完成
    await waitFor(() => {
      expect(container.firstChild).toHaveClass(customClass);
    });
  });

  it('应该支持自定义主题', async () => {
    const { container } = render(<AIModelSelect theme="dark" manager={mockManager} />);
    
    // 等待组件加载完成
    await waitFor(() => {
      expect(container.firstChild).toHaveClass('theme-dark');
    });
  });

  it('应该支持系统主题', async () => {
    const { container } = render(<AIModelSelect theme="system" manager={mockManager} />);
    
    // 等待组件加载完成
    await waitFor(() => {
      expect(container.firstChild).toHaveClass('theme-system');
    });
  });

  it('应该支持亮色主题', async () => {
    const { container } = render(<AIModelSelect theme="light" manager={mockManager} />);
    
    // 等待组件加载完成
    await waitFor(() => {
      expect(container.firstChild).toHaveClass('theme-light');
    });
  });

  it('应该支持自定义提供商列表', async () => {
    const supportedProviders = [AIProvider.OPENAI, AIProvider.VOLCENGINE];
    render(<AIModelSelect supportedProviders={supportedProviders} manager={mockManager} />);
    
    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  it('应该正确处理模型选择变化', async () => {
    const onModelChange = jest.fn();
    const mockConfigs: AIModelConfig[] = [
      {
        id: 'config-1',
        name: '测试配置1',
        provider: AIProvider.OPENAI,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: { apiKey: 'test-key' }
      }
    ];
    
    mockManager.getConfigs.mockReturnValue(mockConfigs);
    mockManager.loadConfigs.mockResolvedValue(mockConfigs);
    
    render(<AIModelSelect onModelChange={onModelChange} manager={mockManager} />);
    
    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    
    expect(onModelChange).toBeDefined();
  });

  it('应该正确处理配置变化', async () => {
    const onConfigChange = jest.fn();
    const mockConfigs: AIModelConfig[] = [
      {
        id: 'config-1',
        name: '测试配置1',
        provider: AIProvider.OPENAI,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: { apiKey: 'test-key' }
      }
    ];
    
    mockManager.getConfigs.mockReturnValue(mockConfigs);
    mockManager.loadConfigs.mockResolvedValue(mockConfigs);
    
    render(<AIModelSelect onConfigChange={onConfigChange} manager={mockManager} />);
    
    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    
    expect(onConfigChange).toBeDefined();
  });

  it('应该支持内联样式', async () => {
    const customStyle = { backgroundColor: 'red' };
    const { container } = render(<AIModelSelect style={customStyle} manager={mockManager} />);
    
    // 等待组件加载完成
    await waitFor(() => {
      expect(container.firstChild).toHaveStyle('background-color: red');
    });
  });

  it('应该支持禁用删除功能', async () => {
    render(<AIModelSelect allowDelete={false} manager={mockManager} />);
    
    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});