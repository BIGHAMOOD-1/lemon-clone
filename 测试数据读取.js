// 测试脚本：验证数据文件读取
const { readFile } = require('fs/promises');
const { join } = require('path');

async function testDataReading() {
  console.log('=== 测试数据文件读取 ===\n');
  
  // 测试 1.txt
  const txtPath = join(process.cwd(), 'data', '1.txt');
  try {
    const txtContent = await readFile(txtPath, 'utf-8');
    console.log('✅ data/1.txt 存在');
    console.log(`   文件大小: ${txtContent.length} 字符`);
    console.log(`   前 100 个字符: ${txtContent.substring(0, 100)}...`);
    console.log(`   内容段数（按冒号分割）: ${txtContent.split(':').length}`);
  } catch (error) {
    console.log('❌ data/1.txt 不存在或读取失败');
  }
  
  console.log();
  
  // 测试 1.json
  const jsonPath = join(process.cwd(), 'data', '1.json');
  try {
    const jsonContent = await readFile(jsonPath, 'utf-8');
    const jsonData = JSON.parse(jsonContent);
    console.log('✅ data/1.json 存在');
    console.log(`   数据类型: ${Array.isArray(jsonData) ? '数组' : typeof jsonData}`);
    if (Array.isArray(jsonData)) {
      console.log(`   数组长度: ${jsonData.length}`);
    }
  } catch (error) {
    console.log('❌ data/1.json 不存在或读取失败');
  }
  
  console.log('\n=== 测试完成 ===');
}

testDataReading().catch(console.error);

