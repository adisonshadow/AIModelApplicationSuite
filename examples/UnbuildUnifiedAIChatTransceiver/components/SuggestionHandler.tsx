
// 图表类型枚举
export enum ChartType {
  Line = 'line',
  Bar = 'bar',
  Pie = 'pie',
  Column = 'column',
  Area = 'area',
  Scatter = 'scatter',
  Radar = 'radar',
  Histogram = 'histogram',
  DualAxes = 'dual-axes'
}

// 图表数据结构接口
export interface ChartData {
  type: ChartType;
  data?: Array<{ [key: string]: any }>;
  categories?: string[];
  title?: string;
  axisXTitle?: string;
  series?: Array<{
    type: ChartType;
    data: number[];
    axisYTitle?: string;
  }>;
}

// Suggestion 处理结果
export interface SuggestionResult {
  processedMessage: string;
  systemPrompt?: string;
}

// Suggestion 处理器
export class SuggestionProcessor {
  /**
   * 处理用户选择 suggestion 后的消息
   * @param message 用户输入的消息
   * @param suggestionValue 选择的 suggestion 值
   * @returns 处理后的结果
   */
  static processSuggestion(message: string, suggestionValue: string): SuggestionResult {
    switch (suggestionValue) {
      case 'vis-chart':
        return this.processVisChartSuggestion(message);
      default:
        return { processedMessage: message };
    }
  }

  /**
   * 处理 VIS Chart suggestion
   * @param message 用户输入的消息
   * @returns 处理后的结果
   */
  private static processVisChartSuggestion(message: string): SuggestionResult {
    // 移除 [vis-chart]: 前缀
    const cleanMessage = message.replace(/^\[vis-chart\]:\s*/, '');
    
    // 生成系统提示词，指导AI返回图表数据
    const systemPrompt = `请根据用户的需求生成一个可视化图表。请严格按照以下JSON格式返回图表数据：

支持的图表类型：
- line: 折线图
- bar: 条形图  
- pie: 饼图
- column: 柱状图
- area: 面积图
- scatter: 散点图
- radar: 雷达图
- histogram: 直方图
- dual-axes: 双轴图

单系列图表格式：
\`\`\`vis-chart
{
  "type": "line",
  "data": [
    { "time": 2013, "value": 59.3 },
    { "time": 2014, "value": 64.4 },
    { "time": 2015, "value": 68.9 }
  ],
  "title": "2013-2015 GDP",
  "axisXTitle": "year",
  "axisYTitle": "GDP"
}
\`\`\`

双轴图表格式：
\`\`\`vis-chart
{
  "type": "dual-axes",
  "categories": ["2018", "2019", "2020", "2021", "2022"],
  "title": "2018-2022销售额与利润率",
  "axisXTitle": "年份",
  "series": [
    {
      "type": "column",
      "data": [91.9, 99.1, 101.6, 114.4, 121],
      "axisYTitle": "销售额"
    },
    {
      "type": "line", 
      "data": [0.055, 0.06, 0.062, 0.07, 0.075],
      "axisYTitle": "利润率"
    }
  ]
}
\`\`\`

各图表类型的data的item字段要求: 
- Line / Area: 
属性	类型	是否必传	默认值	说明
time	string	是	-	数据的时序名称
value	number	是	-	数据的值
group	string	否	-	数据分组名称

- Bar / Column: 
属性	类型	是否必传	默认值	说明
category	string	是	-	数据分类名称
value	number	是	-	数据分类值
group	number	否	-	数据分组名称

- Pie: 
category	string	是	-	扇形区域的名称
value	number	是	-	扇形区域的值

- Scatter: 
属性	类型	是否必传	默认值	说明
category	string	是	-	数据分类名称
value	number	是	-	数据分类值
group	number	否	-	数据分组名称

- Histogram: 直方图的data字段为数据数组，但是在 data 同级必须配置 binNumber，值为数字，表示直方图的bin数量

- Radar: 
属性	类型	是否必传	默认值	说明
name	string	是	-	数据分类名称
value	number	是	-	数据的值
group	string	否	-	数据分组名称

- Radar: 
其他重要要求：
1. 必须使用 \`\`\`vis-chart 代码块包装
2. 数据结构必须严格按照上述格式
3. 数值要合理真实
4. 数值在y轴, 时间、分类等在x轴
5. 图表标题要简洁明了

请根据用户需求生成相应的图表数据。`;

    return {
      processedMessage: cleanMessage,
      systemPrompt
    };
  }
}

// Suggestion Hook
export const useSuggestionHandler = () => {
  /**
   * 处理 suggestion 选择
   * @param message 用户消息
   * @param suggestionValue suggestion 值
   * @returns 处理结果
   */
  const handleSuggestion = (message: string, suggestionValue: string): SuggestionResult => {
    return SuggestionProcessor.processSuggestion(message, suggestionValue);
  };

  return {
    handleSuggestion
  };
};
