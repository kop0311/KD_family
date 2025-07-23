#!/usr/bin/env node

/**
 * KD Family Vercel 自动配置脚本
 * 自动设置环境变量和部署配置
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 预设的配置
const CONFIG = {
  JWT_SECRET: 'ZcL1ndn1c2fEGTPZuj3JD0CCRV/MZRvIi5vfXQiK7GbeQ/IUyEG/jNOhV3LYfhqqlx43G3EHFPMB9YkKG+FmsQ==',
  SUPABASE_REF: 'pjnqbsnmrfhkyhoqfekv',
  SUPABASE_REGION: 'us-east-1',
  NODE_ENV: 'production'
};

console.log('🚀 KD Family Vercel 自动配置工具');
console.log('=====================================');

async function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    console.log('✅ Vercel CLI 已安装');
    return true;
  } catch (error) {
    console.log('❌ Vercel CLI 未安装');
    console.log('请运行: npm install -g vercel');
    return false;
  }
}

async function checkVercelAuth() {
  try {
    execSync('vercel whoami', { stdio: 'ignore' });
    console.log('✅ Vercel 已登录');
    return true;
  } catch (error) {
    console.log('🔐 请先登录Vercel...');
    execSync('vercel login', { stdio: 'inherit' });
    return true;
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function askPassword(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    process.stdin.on('data', function(char) {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function setVercelEnv(name, value, environments = ['production', 'preview', 'development']) {
  console.log(`设置 ${name}...`);
  
  for (const env of environments) {
    try {
      // 删除现有的环境变量（如果存在）
      try {
        execSync(`vercel env rm ${name} ${env} --yes`, { stdio: 'ignore' });
      } catch (e) {
        // 忽略删除错误（变量可能不存在）
      }
      
      // 添加新的环境变量
      execSync(`echo "${value}" | vercel env add ${name} ${env}`, { stdio: 'ignore' });
    } catch (error) {
      console.error(`❌ 设置 ${name} 在 ${env} 环境失败:`, error.message);
    }
  }
}

async function createLocalEnv(dbPassword) {
  const envContent = `# KD Family Environment Variables
# 本地开发环境配置

# Database Configuration
DATABASE_URL="postgresql://postgres.${CONFIG.SUPABASE_REF}:${dbPassword}@aws-0-${CONFIG.SUPABASE_REGION}.pooler.supabase.com:6543/postgres"

# JWT Configuration
JWT_SECRET="${CONFIG.JWT_SECRET}"

# Application Configuration
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase Configuration (for reference)
SUPABASE_URL="https://${CONFIG.SUPABASE_REF}.supabase.co"
SUPABASE_REF="${CONFIG.SUPABASE_REF}"
`;

  fs.writeFileSync('.env.local', envContent);
  console.log('✅ 已创建 .env.local 文件');
}

async function main() {
  try {
    // 检查依赖
    if (!(await checkVercelCLI())) {
      process.exit(1);
    }
    
    if (!(await checkVercelAuth())) {
      process.exit(1);
    }

    console.log('\n📋 配置信息:');
    console.log(`Supabase 项目: ${CONFIG.SUPABASE_REF}`);
    console.log(`JWT Secret: 已预设`);
    console.log('');

    // 获取数据库密码
    const dbPassword = await askPassword('请输入你的Supabase数据库密码: ');
    
    if (!dbPassword) {
      console.log('❌ 数据库密码不能为空');
      process.exit(1);
    }

    // 构建数据库URL
    const DATABASE_URL = `postgresql://postgres.${CONFIG.SUPABASE_REF}:${dbPassword}@aws-0-${CONFIG.SUPABASE_REGION}.pooler.supabase.com:6543/postgres`;

    console.log('\n🔧 正在配置Vercel环境变量...');

    // 设置环境变量
    await setVercelEnv('JWT_SECRET', CONFIG.JWT_SECRET);
    await setVercelEnv('DATABASE_URL', DATABASE_URL);
    await setVercelEnv('NODE_ENV', CONFIG.NODE_ENV, ['production']);

    // 创建本地环境文件
    await createLocalEnv(dbPassword);

    console.log('\n✅ 配置完成！');
    console.log('\n📋 已配置的环境变量:');
    console.log('- JWT_SECRET: ✅');
    console.log('- DATABASE_URL: ✅');
    console.log('- NODE_ENV: ✅');
    console.log('- .env.local: ✅');

    console.log('\n🚀 下一步:');
    console.log('1. 运行: vercel --prod (手动部署)');
    console.log('2. 或推送代码触发自动部署');
    console.log('3. 访问: https://kd-family.vercel.app/api/test-db 验证配置');

    console.log('\n🎉 自动配置完成！');

  } catch (error) {
    console.error('❌ 配置失败:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
