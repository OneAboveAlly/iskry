declare module 'react-quill' {
  import React from 'react';
  
  export interface ReactQuillProps {
    value: string;
    onChange: (value: string) => void;
    theme?: string;
    modules?: Record<string, any>;
    formats?: string[];
    placeholder?: string;
    bounds?: string | HTMLElement;
    readOnly?: boolean;
    className?: string;
    style?: React.CSSProperties;
    tabIndex?: number;
    preserveWhitespace?: boolean;
    scrollingContainer?: string | HTMLElement;
    // Możesz dodać więcej właściwości, jeśli potrzebujesz
  }
  
  export default class ReactQuill extends React.Component<ReactQuillProps> {
    static Quill: any;
    getEditor(): any;
    focus(): void;
    blur(): void;
  }
} 