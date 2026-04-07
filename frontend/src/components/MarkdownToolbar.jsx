import React from 'react';

const MarkdownToolbar = ({ result, setResult }) => {
  const insertText = (startTag, endTag = '') => {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = result.substring(start, end);
    const beforeText = result.substring(0, start);
    const afterText = result.substring(end);
    
    const newText = beforeText + startTag + selectedText + endTag + afterText;
    setResult(newText);
    
    // Set focus back and adjust selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + startTag.length,
        end + startTag.length + selectedText.length
      );
    }, 0);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3 bg-gray-50 p-2 rounded-t-lg border-b border-gray-200">
      <button onClick={() => insertText('**', '**')} className="px-2 py-1 text-gray-600 hover:bg-white hover:text-indigo-600 rounded text-sm font-bold" title="加粗">B</button>
      <button onClick={() => insertText('*', '*')} className="px-2 py-1 text-gray-600 hover:bg-white hover:text-indigo-600 rounded text-sm italic" title="斜体">I</button>
      <button onClick={() => insertText('### ')} className="px-2 py-1 text-gray-600 hover:bg-white hover:text-indigo-600 rounded text-sm font-bold" title="标题">H3</button>
      <div className="w-px h-4 bg-gray-300 mx-1"></div>
      <button onClick={() => insertText('`', '`')} className="px-2 py-1 text-gray-600 hover:bg-white hover:text-indigo-600 rounded text-sm font-mono" title="代码">`code`</button>
      <button onClick={() => insertText('```\n', '\n```')} className="px-2 py-1 text-gray-600 hover:bg-white hover:text-indigo-600 rounded text-sm font-mono" title="代码块">```</button>
      <div className="w-px h-4 bg-gray-300 mx-1"></div>
      <button onClick={() => insertText('[链接描述](', ')')} className="px-2 py-1 text-gray-600 hover:bg-white hover:text-indigo-600 rounded text-sm" title="链接">Link</button>
      <button onClick={() => insertText('![图片描述](', ')')} className="px-2 py-1 text-gray-600 hover:bg-white hover:text-indigo-600 rounded text-sm" title="图片">Img</button>
      <button onClick={() => insertText('- ')} className="px-2 py-1 text-gray-600 hover:bg-white hover:text-indigo-600 rounded text-sm" title="无序列表">• List</button>
      <button onClick={() => insertText('1. ')} className="px-2 py-1 text-gray-600 hover:bg-white hover:text-indigo-600 rounded text-sm" title="有序列表">1. List</button>
      <button onClick={() => insertText('> ')} className="px-2 py-1 text-gray-600 hover:bg-white hover:text-indigo-600 rounded text-sm" title="引用">“ Quote</button>
    </div>
  );
};

export default MarkdownToolbar;
