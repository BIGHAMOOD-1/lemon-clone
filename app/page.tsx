'use client';

import { useChat } from 'ai/react';
import { Send } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: '/api/chat',
    });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* 固定头部 */}
      <header className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center gap-3">
          {/* 照片区域 */}
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-700 bg-zinc-800">
            <img
              src="/avatar.jpg"
              alt="b神头像"
              className="h-full w-full object-cover"
              onError={(e) => {
                // 如果图片加载失败，隐藏图片并显示占位符
                const target = e.currentTarget;
                target.style.display = 'none';
                const placeholder = target.parentElement?.querySelector('.placeholder');
                if (placeholder) {
                  placeholder.classList.remove('hidden');
                }
              }}
            />
            <div className="placeholder hidden h-full w-full items-center justify-center text-zinc-500">
              <span className="text-xs">照片</span>
            </div>
          </div>
          <h1 className="text-xl font-semibold">b神</h1>
        </div>
      </header>

      {/* 滚动聊天区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-zinc-400">
              <p>开始与 b神 聊天吧～</p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-100'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-zinc-800 px-4 py-2">
                <p className="text-zinc-400">正在思考...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 固定底部输入 */}
      <footer className="border-t border-zinc-800 bg-zinc-950 px-4 py-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="输入消息..."
            disabled={isLoading}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
