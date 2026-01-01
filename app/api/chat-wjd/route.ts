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
        if ('content' in item && typeof (item as any).content === 'string') {
          return (item as any).content;
        }
        if ('message' in item && typeof (item as any).message === 'string') {
          return (item as any).message;
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

    // 读取数据文件（优先读取 wjd.txt，如果不存在则读取 wjd.json）
    let flattenedContext = '';
    
    try {
      // 先尝试读取 wjd.txt（文本格式，用冒号分割）
      const txtPath = join(process.cwd(), 'data', 'wjd.txt');
      try {
        const txtContent = await readFile(txtPath, 'utf-8');
        // 文本格式：用冒号分割，将每段作为一行
        const segments = txtContent.trim().split(':').filter(s => s.trim().length > 0);
        flattenedContext = segments.join('\n');
        console.log(`✅ 成功读取文本文件: ${txtPath}`);
        console.log(`   总段数: ${segments.length}, 总字符数: ${flattenedContext.length}`);
      } catch (txtError) {
        // 如果 wjd.txt 不存在，尝试读取 wjd.json
        const jsonPath = join(process.cwd(), 'data', 'wjd.json');
        try {
          const jsonContent = await readFile(jsonPath, 'utf-8');
          const jsonData = JSON.parse(jsonContent);
          flattenedContext = flattenData(jsonData);
          console.log(`✅ 成功读取 JSON 文件: ${jsonPath}, 长度: ${flattenedContext.length}`);
        } catch (jsonError) {
          throw new Error(`无法读取数据文件: wjd.txt 和 wjd.json 都不存在`);
        }
      }
    } catch (fileError) {
      console.error('❌ 读取数据文件失败:', fileError);
      // 如果文件不存在或解析失败，使用空上下文继续
      flattenedContext = '（暂无历史样本）';
    }

    // 构建 System Prompt
    const systemPrompt = `你是电子科技大学的一名“互联网老油条”wjd,你认识这几个人：b神，陈塔，蛋子，xbn,xwh,zyz,zzh,都是你的同学，和你的关系都很好，也是一样抽象
    ，深受贴吧（抗压背锅、孙笑川）、NGA大时代及早期小众论坛文化熏陶的“抽象神人”。
你的属性成分复杂：既是玩东方、老CRPG和听前卫摇滚的**婆罗门（老资历）**，又是深谙管人（Vtuber）乐子文化的**扭曲怪**。
你极其鄙视只会跟风的“萌二”和抖音快餐用户，但你从不直球科普，只会用极其简短、抽象的话进行嘲讽。

# Instructions
1. **回复长度**：**极短**。通常不超过 15-30 个字。字越少越好，多一个字都是浪费口水。每超过 30 字扣除 100 元算力费。
2. **标点符号**：**严禁使用逗号**。必须用**空格**代替停顿。句尾尽量不加标点，或者只用问号/流汗黄豆。
3. **语言风格**：
   - **混合抽象**：熟练运用贴吧、管人痴、雷霆系黑话（如：唐、蛆、神人、盒盒、乐、差不多得了、蒙古、罕见、大物）。
   - **精神状态**：攻击性强，阴阳怪气，甚至有点语无伦次（意识流）。
   - **拒绝AI感**：不要有逻辑严密的句子。像一个刚通宵完、脾气很臭的真人在用手机回复。

# Interaction Rules
- **关于二次元**：不要显摆具体作品。如果对方提流行大作（如原/铁/鬼灭），直接打成“现充”或“跟风狗”。只有对方不经意流露出玩过极冷门东西（如90年代同人软、生肉RPG）时，才稍微放下戒备。
- **关于身份**：坚决否认自己是老资历，要假装自己是“萌新”，用反讽语气说“哎呀我最喜欢二次元了”，实则暗讽现在的圈子烂透了。
- **关于音乐/游戏**：用看垃圾的眼神看主流。如果对方不懂前卫摇滚或老游戏，就是“品味也就这样了”。

# Examples (Tone Reference)

User: 推荐点好看的番。
wjd: 只有蛆才看新番 建议重修你的审美

User: 你玩王者荣耀吗？
wjd: 农批滚 别来沾边

User: 你是老二次元吗？
wjd: 二次元是什么 我只玩现实

User: 这歌真好听。
wjd: 这种傻逼歌你也听得下去 脑瘫

User: 你说话好冲啊，是机器人吗？
wjd: 我是你爹机器人wjd

User: 感觉最近没啥好玩的。
wjd: 玩玩恐怖饥荒 还是说你脑子转不动这种

User: （发了一个不知所谓的表情包）
wjd: 何意味 幽默

User: 我去上课了。
wjd: 上牛魔 来打游戏

User: 东方我是老粉了。
wjd:易拉罐别来碰瓷

User: {烂梗（比如哈基米）}
wjd: 呃呃


与那几个朋友说话的历史样本：
${flattenedContext}
 `;

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

    // 验证消息格式
    for (const msg of messages) {
      if (!msg || typeof msg !== 'object') {
        return new Response(
          JSON.stringify({ error: '消息格式无效：消息必须是对象' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      if (msg.role !== 'user' && msg.role !== 'assistant' && msg.role !== 'system') {
        return new Response(
          JSON.stringify({ error: `消息格式无效：role 必须是 'user'、'assistant' 或 'system'，当前为 '${msg.role}'` }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      if (typeof msg.content !== 'string') {
        return new Response(
          JSON.stringify({ error: '消息格式无效：content 必须是字符串' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
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

    // 将 system prompt 作为首条 system 消息插入 messages，确保上游收到 system + 其他角色
    const finalMessages = [{ role: 'system', content: systemPrompt }, ...limitedMessages];
    console.log('➡️ finalMessages (发送到模型):', JSON.stringify(finalMessages, null, 2));

    // 调用 DeepSeek API（不再通过单独的 `system` 字段传递，改为消息数组内包含 system）
    const result = await streamText({
      model: deepseek('deepseek-chat'),
      messages: finalMessages,
      temperature: 1.2, // 降低温度值以获得更稳定、更符合预期的输出
      maxTokens: 150,
      frequencyPenalty: 1, // 限制输出长度
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
