import React from 'react';

const ToolbarButton = ({ onClick, title, children, className = "" }) => (
  <button 
    onClick={(e) => { e.preventDefault(); onClick(); }} 
    className={`p-1.5 min-w-[28px] flex items-center justify-center text-gray-400 hover:bg-slate-700 hover:text-indigo-300 rounded-md transition-colors ${className}`} 
    title={title}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-slate-700 mx-1.5" />;

const MarkdownToolbar = ({ result, setResult }) => {
  const insertText = (startTag, endTag = '', defaultText = '') => {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const hasSelection = start !== end;
    const selectedText = hasSelection ? result.substring(start, end) : defaultText;
    const beforeText = result.substring(0, start);
    const afterText = result.substring(end);
    
    const newText = beforeText + startTag + selectedText + endTag + afterText;
    setResult(newText);
    
    // Set focus back and adjust selection
    setTimeout(() => {
      textarea.focus();
      if (!hasSelection && defaultText) {
        // Select the default text for easy replacement
        textarea.setSelectionRange(
          start + startTag.length,
          start + startTag.length + defaultText.length
        );
      } else {
        // Place cursor after inserted block
        textarea.setSelectionRange(
          start + startTag.length + selectedText.length,
          start + startTag.length + selectedText.length + endTag.length
        );
      }
    }, 0);
  };

  return (
    <div className="flex flex-wrap items-center px-3 py-2 bg-slate-800 border-b border-slate-700 select-none m-0 shadow-inner">
      {/* Undo/Redo style group (Headers) */}
      <ToolbarButton onClick={() => insertText('# ', '', '一级标题')} title="一级标题" className="font-bold text-sm">H1</ToolbarButton>
      <ToolbarButton onClick={() => insertText('## ', '', '二级标题')} title="二级标题" className="font-bold text-sm">H2</ToolbarButton>
      <ToolbarButton onClick={() => insertText('### ', '', '三级标题')} title="三级标题" className="font-bold text-sm">H3</ToolbarButton>
      
      <Divider />

      {/* Formatting group */}
      <ToolbarButton onClick={() => insertText('**', '**', '加粗文本')} title="加粗">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6zM6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => insertText('*', '*', '斜体文本')} title="斜体">
        <svg className="w-4 h-4 italic" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4-8H14m-4 16H6"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => insertText('~~', '~~', '删除文本')} title="删除线">
        <span className="line-through text-sm font-bold">S</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => insertText('==', '==', '高亮文本')} title="高亮">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.2,11L14,5l-4-1l-2,4l3,3L15.2,11z M5,18l2.5-2.5L5,13v-2l5,5l1,1l-2,2L5,18z M21,18l-4,4l-4.5-4.5L16.5,14L19,16 L21,18z"/></svg>
      </ToolbarButton>

      <Divider />

      {/* Lists & Quotes group */}
      <ToolbarButton onClick={() => insertText('- ', '', '列表项')} title="无序列表">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16M4 6h.01M4 12h.01M4 18h.01" /></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => insertText('1. ', '', '列表项')} title="有序列表">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h14M7 12h14M7 18h14M4 6h.01M4 12h.01M4 18h.01" /></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => insertText('- [ ] ', '', '任务项')} title="任务列表">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => insertText('> ', '', '引用内容')} title="引用">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 18L14.017 10.609C14.017 4.905 17.748 1.039 23 0L23.995 2.151C21.563 3.068 20 5.789 20 8H24V18H14.017ZM0 18V10.609C0 4.905 3.748 1.038 9 0L9.996 2.151C7.563 3.068 6 5.789 6 8H9.983L9.983 18L0 18Z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => insertText('\n---\n')} title="分割线">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>
      </ToolbarButton>

      <Divider />

      {/* Code & Math group */}
      <ToolbarButton onClick={() => insertText('`', '`', 'code')} title="行内代码" className="font-mono font-bold text-sm">
        {`</>`}
      </ToolbarButton>
      <ToolbarButton onClick={() => insertText('\n```\n', '\n```\n', 'const code = "here";')} title="代码块">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4-8H14m-4 16H6 M4 7l-3 5 3 5 M20 7l3 5-3 5" /></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => insertText(' $', '$ ', 'E=mc^2')} title="行内公式" className="font-serif italic font-bold">
        ∑
      </ToolbarButton>
      <ToolbarButton onClick={() => insertText('\n$$\n', '\n$$\n', 'a^2 + b^2 = c^2')} title="居中公式块" className="font-serif font-bold text-sm">
        fx
      </ToolbarButton>

      <Divider />

      {/* Links & Media */}
      <ToolbarButton onClick={() => insertText('[', '](https://...)', '链接描述')} title="超链接">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => insertText('![', '](https://... "图片描述")', '图片替代名')} title="插入图片">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => insertText('\n| 标题 | 标题 |\n| :--- | :--- |\n| 内容 | 内容 |\n')} title="插入表格">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      </ToolbarButton>
    </div>
  );
};

export default MarkdownToolbar;
