import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { readFile } from 'fs/promises';
import { join } from 'path';

// 解析并展平 JSON 数据
function flattenData(data: unknown): string {
  if (!Array.isArray(data)) {
    return '';
  }

  return data
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      if (typeof item === 'object' && item !== null) {
        // 尝试获取 content 或 message 字段
        if ('content' in item && typeof item.content === 'string') {
          return item.content;
        }
        if ('message' in item && typeof item.message === 'string') {
          return item.message;
        }
      }
      return '';
    })
    .filter((msg) => msg.length > 0)
    .join('\n');
}

// 限制输入长度（200 字）
function limitInputLength(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength);
}

export async function POST(req: Request) {
  try {
    // 检查 API Key
    if (!process.env.DEEPSEEK_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'DEEPSEEK_API_KEY 未配置，请在 .env.local 中设置' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 读取数据文件（优先读取 1.txt，如果不存在则读取 1.json）
    let flattenedContext = '';
    
    try {
      // 先尝试读取 1.txt（文本格式，用冒号分割）
      const txtPath = join(process.cwd(), 'data', '1.txt');
      try {
        const txtContent = await readFile(txtPath, 'utf-8');
        // 文本格式：用冒号分割，将每段作为一行
        const segments = txtContent.trim().split(':').filter(s => s.trim().length > 0);
        flattenedContext = segments.join('\n');
        console.log(`✅ 成功读取文本文件: ${txtPath}`);
        console.log(`   总段数: ${segments.length}, 总字符数: ${flattenedContext.length}`);
      } catch (txtError) {
        // 如果 1.txt 不存在，尝试读取 1.json
        const jsonPath = join(process.cwd(), 'data', '1.json');
        try {
          const jsonContent = await readFile(jsonPath, 'utf-8');
          const jsonData = JSON.parse(jsonContent);
          flattenedContext = flattenData(jsonData);
          console.log(`✅ 成功读取 JSON 文件: ${jsonPath}, 长度: ${flattenedContext.length}`);
        } catch (jsonError) {
          throw new Error(`无法读取数据文件: 1.txt 和 1.json 都不存在`);
        }
      }
    } catch (fileError) {
      console.error('❌ 读取数据文件失败:', fileError);
      // 如果文件不存在或解析失败，使用空上下文继续
      flattenedContext = '（暂无历史样本）';
    }

    // 构建 System Prompt
    const systemPrompt = `你是b神，一名大学生，ACG 爱好者，性格激进、幽默、讽刺。

请完全模仿以下历史样本的语气和词汇。不要承认自己是 AI。保持回复简短（50 字以内）。

历史样本：
${flattenedContext}`;

    // 获取消息
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: '无效的消息格式' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 限制用户输入长度（每条消息最多 200 字）
    const limitedMessages = messages.map((msg: any) => {
      if (msg.role === 'user' && typeof msg.content === 'string') {
        return {
          ...msg,
          content: limitInputLength(msg.content, 200),
        };
      }
      return msg;
    });

    // 创建 DeepSeek OpenAI 客户端
    const deepseek = createOpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
    });

    // 调用 DeepSeek API
    const result = await streamText({
      model: deepseek('deepseek-chat'),
      system: systemPrompt,
      messages: limitedMessages, // 使用限制后的消息
      temperature: 1.5,
      maxTokens: 200, // 限制输出长度，约 150-200 字（符合"50 字以内"的要求，留有余量）
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: `服务器错误: ${errorMessage}` }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

