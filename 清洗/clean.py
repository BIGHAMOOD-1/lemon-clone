#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据清洗程序
从原始数据中提取指定人物的内容
"""

import re
import sys
from pathlib import Path

# ==================== 配置区域 ====================
# 在 VSCode 中直接运行时，修改这里的配置即可
INPUT_FILE = "group_1031996505_20251230_231232.txt"  # 输入文件路径
PERSON_NAME = "swern"  # 要提取的人物名称
OUTPUT_FILE = "2.txt"  # 输出文件路径
# ==================================================


def clean_content(text: str) -> str:
    """
    清洗内容，移除不需要的部分
    
    Args:
        text: 原始内容
        
    Returns:
        清洗后的内容
    """
    # 移除图片信息 [图片: ...]
    text = re.sub(r'\[图片:[^\]]+\]', '', text)
    
    # 移除回复前缀 [回复 u_...: 原消息]: 或 [回复 u_...: 原消息]
    # 支持各种可能的格式变化
    text = re.sub(r'\[回复\s+u_[^:\]]+:\s*原消息\]\s*:?\s*', '', text)
    
    # 清理多余的空白字符（保留单个空格）
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()


def extract_person_content(input_file: str, person_name: str, output_file: str = "1.txt"):
    """
    从输入文件中提取指定人物的内容
    
    Args:
        input_file: 输入文件路径
        person_name: 要提取的人物名称（如 "DjjD"）
        output_file: 输出文件路径，默认为 "1.txt"
    """
    try:
        # 读取输入文件
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"错误: 找不到输入文件 {input_file}")
        return
    except Exception as e:
        print(f"错误: 读取文件失败 - {e}")
        return
    
    # 使用正则表达式匹配指定人物的所有记录
    # 匹配格式: 人物名:\n\n时间: ...\n\n内容: ...\n\n提及: ...
    # 处理可能的多个换行和空白字符
    pattern = rf'{re.escape(person_name)}:\s*\n+\s*时间:\s*[^\n]+\s*\n+\s*内容:\s*([^\n]+)'
    
    matches = re.findall(pattern, content, re.MULTILINE)
    
    if not matches:
        print(f"警告: 未找到人物 '{person_name}' 的任何内容")
        return
    
    # 提取所有内容，清洗后过滤空内容
    contents = []
    for match in matches:
        cleaned = clean_content(match.strip())
        if cleaned:  # 只保留清洗后非空的内容
            contents.append(cleaned)
    
    if not contents:
        print(f"警告: 人物 '{person_name}' 的内容为空或全部被过滤")
        return
    
    # 用 : 连接所有内容
    result = ':'.join(contents)
    
    # 写入输出文件
    try:
        output_path = Path(output_file)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(result)
        print(f"成功: 已提取 {len(contents)} 条内容，输出到 {output_file}")
        print(f"总字符数: {len(result)}")
    except Exception as e:
        print(f"错误: 写入文件失败 - {e}")


def main():
    """主函数"""
    # 如果提供了命令行参数，优先使用命令行参数
    if len(sys.argv) >= 3:
        input_file = sys.argv[1]
        person_name = sys.argv[2]
        output_file = sys.argv[3] if len(sys.argv) > 3 else "1.txt"
    else:
        # 否则使用配置区域的默认值（适合 VSCode 直接运行）
        input_file = INPUT_FILE
        person_name = PERSON_NAME
        output_file = OUTPUT_FILE
        print(f"使用配置区域的值:")
        print(f"  输入文件: {input_file}")
        print(f"  人物名称: {person_name}")
        print(f"  输出文件: {output_file}")
        print()
    
    extract_person_content(input_file, person_name, output_file)


if __name__ == "__main__":
    main()

