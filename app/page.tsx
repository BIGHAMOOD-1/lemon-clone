'use client';

import { useChat } from 'ai/react';
import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Character = {
  key: string;
  name: string;
  avatar: string;
};

const characters: Character[] = [
  { key: 'b',   name: 'b神', avatar: '/avatar.jpg' },
  { key: 'wjd', name: 'wjd', avatar: '/wjd-avatar.jpg' },
];

export default function Home() {
  const [idx, setIdx] = useState(0);
  const current = characters[idx];
  
  // 使用 messagesEndRef 实现自动滚动
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading, 
    error, 
    stop,         // 用于停止生成
    setMessages,  // 用于手动清空消息列表
    setInput      // 用于手动清空输入框
  } = useChat({
      api: `/api/chat-${current.key}`,
      // fetch: customFetch as any, // 删掉了这个复杂的 customFetch，useChat 自带切换时的取消功能
      onError: (err) => {
        console.error('Chat API error:', err);
        // 这里删除了会导致报错的 setShowTyping(false)
      },
    });

  // 核心优化：切换角色时的清理逻辑
  useEffect(() => {
    // 1. 如果正在生成，立即停止
    stop();
    // 2. 清空聊天记录
    setMessages([]);
    // 3. 清空输入框
    setInput('');
  }, [idx, stop, setMessages, setInput]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* 顶部角色切换 Tabs */}
      <header className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center gap-3">
          {/* 这里加了一个简单的 fallback，防止图片路径不对时裂开 */}
          <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-800">
             <img
              src={current.avatar}
              alt={current.name}
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="text-xl font-semibold">{current.name}</h1>
        </div>

        {/* 可见的 Tabs */}
        <div className="flex gap-2">
          {characters.map((c, i) => (
            <button
              key={c.key}
              onClick={() => setIdx(i)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                i === idx
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </header>

      {/* 聊天区 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full min-h-[50vh] items-center justify-center text-zinc-500">
              <p>开始与 {current.name} 聊天吧～</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-100'
                }`}
              >
                {/* 使用 whitespace-pre-wrap 使得换行符能正常显示 */}
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>
          ))}

          {error && (
            <div className="flex justify-center">
              <div className="max-w-[80%] rounded-lg bg-red-900/50 border border-red-700 px-4 py-2">
                <p className="text-sm text-red-300">
                  错误: {error.message || '发生未知错误，请稍后重试'}
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 底部输入 */}
      <footer className="border-t border-zinc-800 bg-zinc-950 px-4 py-4">
        <form onSubmit={handleFormSubmit} className="mx-auto flex max-w-3xl gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={`给 ${current.name} 发送消息...`}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </footer>
    </div>
  );
}