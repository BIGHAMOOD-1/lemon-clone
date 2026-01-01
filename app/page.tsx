'use client';

import { useChat } from 'ai/react';
import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Character = {
  key: string;          // 对应 /api/chat-key
  name: string;
  avatar: string;
  typingName: string;
};

const characters: Character[] = [
  { key: 'b',    name: 'b神', avatar: '/avatar.jpg',    typingName: 'b 神' },
  { key: 'wjd',  name: 'wjd', avatar: '/wjd-avatar.jpg', typingName: 'wjd' },
];

export default function Home() {
  const [idx, setIdx] = useState(0);
  const current = characters[idx];
  const abortControllerRef = useRef<AbortController | null>(null);

  // 切换角色时重新加载对话
  // 自定义 fetch 用于在切换角色时中止前一个请求
  const customFetch = async (input: RequestInfo, init?: RequestInit) => {
    // 使用 abortControllerRef 的 signal（如果存在）以便外部可中止请求
    const signal = init?.signal ?? abortControllerRef.current?.signal;
    return fetch(input, { ...init, signal });
  };

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, reload, setData } =
    useChat({
      api: `/api/chat-${current.key}`,
      fetch: customFetch,
      onError: (err) => {
        console.error('Chat API error:', err);
        setShowTyping(false);
      },
    });

  // 角色变化 => 清空历史并重新请求
  useEffect(() => {
    // 中止前一个未完成的请求，防止其随后更新 UI
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // 新 controller 绑定给后续请求（useChat 会在内部发起 fetch 请求）
      abortControllerRef.current = new AbortController();
    } catch (e) {}

    // 先清空当前会话数据并输入，避免旧的流在切换时继续更新 UI
    try {
      setData([]);
    } catch (e) {}
    // handleInputChange 期望接收事件对象而不是字符串，传入合成事件避免读取 undefined
    try {
      handleInputChange({ target: { value: '' } } as any);
    } catch (e) {}

    // 不再手动调用 reload() 避免重复请求，useChat 会在 api 变更时发起请求一次
  }, [idx]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          <img
            src={current.avatar}
            alt={current.name}
            className="h-10 w-10 rounded-full object-cover"
          />
          <h1 className="text-xl font-semibold">{current.name}</h1>
        </div>

        {/* 可见的 Tabs */}
        <div className="flex gap-2">
          {characters.map((c, i) => (
            <button
              key={c.key}
              onClick={() => setIdx(i)}
              className={`rounded-md px-3 py-1 text-sm ${
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
            <div className="flex h-full items-center justify-center text-zinc-400">
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
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-100'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* 打字效果已移除 */}

          {error && (
            <div className="flex justify-center">
              <div className="max-w-[80%] rounded-lg bg-red-900/50 border border-red-700 px-4 py-2">
                <p className="text-red-300">
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