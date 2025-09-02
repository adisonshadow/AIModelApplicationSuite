import React from 'react';
import { ReadOutlined, AreaChartOutlined } from '@ant-design/icons';
import type { GetProp } from 'antd';

// Suggestion 项目类型
export type SuggestionItems = Exclude<GetProp<typeof import('@ant-design/x').Suggestion, 'items'>, () => void>;

// Suggestion 配置
export const suggestions: SuggestionItems = [
  { 
    label: 'Draw a VIS Chart', 
    value: 'vis-chart',
    icon: <AreaChartOutlined />
  },
  { 
    label: 'Write a report', 
    value: 'report' 
  },
  { 
    label: 'Draw a picture', 
    value: 'draw' 
  },
  {
    label: 'Check some knowledge',
    value: 'knowledge',
    icon: <ReadOutlined />,
    children: [
      {
        label: 'About React',
        value: 'react',
      },
      {
        label: 'About Ant Design',
        value: 'antd',
      },
    ],
  },
];

// Suggestion 处理器配置
export interface SuggestionConfig {
  items: SuggestionItems;
  onSelect: (value: string) => void;
}

// Suggestion 配置组件
export const SuggestionConfigComponent: React.FC<SuggestionConfig> = () => {
  return null; // 这个组件主要用于导出配置，实际使用在 Suggestion 组件中
};
