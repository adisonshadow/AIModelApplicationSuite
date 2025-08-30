declare module 'markdown-it' {
  interface MarkdownIt {
    render(content: string): string;
  }
  
  interface MarkdownItOptions {
    html?: boolean;
    breaks?: boolean;
  }
  
  function markdownit(options?: MarkdownItOptions): MarkdownIt;
  
  export = markdownit;
}

declare module 'react-syntax-highlighter' {
  import { ComponentType } from 'react';
  
  interface SyntaxHighlighterProps {
    language?: string;
    style?: any;
    wrapLongLines?: boolean;
    children?: string;
  }
  
  export const Prism: ComponentType<SyntaxHighlighterProps>;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  export const vscDarkPlus: any;
}
