import re
import sys
from pathlib import Path

# ================= 配置区域 =================
INPUT_FILE = "蛋子.txt"  # 输入文件路径
PERSON_NAME = "sh1k1"  # 要提取的人物名称 (必须完全一致)
OUTPUT_FILE = "dan.txt"  # 输出文件路径


# ===========================================

def clean_text(text: str) -> str:
    """
    清洗单条消息的核心逻辑
    """
    if not text:
        return ""

    # 1. 去除 URL 链接 (http/https)
    text = re.sub(r'https?://\S+|www\.\S+', '', text)

    # 2. 去除 XML 代码块 (如 <?xml ...>) 和 HTML 标签
    text = re.sub(r'<\?xml.*?>', '', text, flags=re.IGNORECASE)
    text = re.sub(r'<[^>]+>', '', text)

    # 3. 去除各种中括号标签
    # 包括: [图片:...], [文件:...], [视频:...], [表情], [回复 u_...], [1]
    # 解释: \[[^\]]*\] 匹配中括号及里面的任何非中括号内容
    text = re.sub(r'\[(图片|文件|视频|语音|表情|回复)[^\]]*\]', '', text)
    # 针对 [回复 u_xxx: 原消息] 这种复杂格式
    text = re.sub(r'\[回复\s+[^\]]+\]', '', text)
    # 去除系统生成的 [1] 这种引用标号
    text = re.sub(r'\[\d+\]', '', text)

    # 4. 去除多余的空格和换行
    # 将多个空格合并为一个，去除首尾空白
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'资源:\s*\d+\s*个文件\s*-\s*[a-zA-Z]+:.*', '', text)
    return text


def extract_and_clean(input_path, target_name, output_path):
    print(f"正在读取文件: {input_path} ...")

    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ 读取失败: {e}")
        return

    # === 核心提取逻辑 ===
    # 解释:
    # 1. re.escape(target_name) + r':\s*\n': 匹配 "sh1k1:" 加上换行
    # 2. .*?时间:[^\n]+\n: 忽略时间行
    # 3. \s*内容:(.*?): 捕获 "内容:" 后面的所有东西
    # 4. (?=\n.*?:\s*\n|$): 向后预搜索，直到遇到"任意名字+冒号+换行"或者"文件结束"
    # flags=re.DOTALL 让 . 可以匹配换行符，处理多行消息
    pattern = (
            re.escape(target_name) +
            r':\s*\n\s*时间:[^\n]+\n\s*内容:(.*?)(?=\n[^:\n]+:\s*\n|\Z)'
    )

    matches = re.findall(pattern, content, flags=re.DOTALL)

    print(f"原始抓取到 {len(matches)} 条记录，开始清洗...")

    cleaned_lines = []
    for raw_msg in matches:
        clean_msg = clean_text(raw_msg)
        # 只有清洗后还有字的消息才保留
        if clean_msg and len(clean_msg) > 0:
            cleaned_lines.append(clean_msg)

    # 去重（可选，如果不想只要唯一的语录，可以注释掉这行）
    # cleaned_lines = list(set(cleaned_lines))

    # 写入文件
    if cleaned_lines:
        with open(output_path, 'w', encoding='utf-8') as f:
            # 使用换行符分隔每一句话，适合 RAG 入库
            f.write('\n'.join(cleaned_lines))

        print(f"✅ 成功! 已保存 {len(cleaned_lines)} 条有效语录到: {output_path}")
        print("前5条预览:")
        for line in cleaned_lines[:5]:
            print(f" - {line}")
    else:
        print("⚠️ 警告: 没有提取到任何有效内容，请检查人物名称是否完全匹配。")


if __name__ == "__main__":
    # 兼容命令行参数运行
    in_file = sys.argv[1] if len(sys.argv) > 1 else INPUT_FILE
    p_name = sys.argv[2] if len(sys.argv) > 2 else PERSON_NAME
    out_file = sys.argv[3] if len(sys.argv) > 3 else OUTPUT_FILE

    extract_and_clean(in_file, p_name, out_file)