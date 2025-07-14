#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 检查是否为Windows系统
const isWindows = process.platform === 'win32';

// 获取脚本路径
const scriptPath = path.join(__dirname, 'build-icons.sh');

// 检查脚本文件是否存在
if (!fs.existsSync(scriptPath)) {
    console.error('❌ 错误: 找不到构建脚本文件');
    process.exit(1);
}

// 根据操作系统选择执行方式
let command, args;

if (isWindows) {
    // Windows下使用Git Bash或WSL
    const gitBashPath = 'C:\\Program Files\\Git\\bin\\bash.exe';
    const gitBashPath2 = 'C:\\Program Files (x86)\\Git\\bin\\bash.exe';
    
    let bashPath = null;
    
    // 检查Git Bash是否存在
    if (fs.existsSync(gitBashPath)) {
        bashPath = gitBashPath;
    } else if (fs.existsSync(gitBashPath2)) {
        bashPath = gitBashPath2;
    } else {
        // 尝试使用系统bash（如果有WSL或其他bash）
        bashPath = 'bash';
    }
    
    command = bashPath;
    args = [scriptPath, ...process.argv.slice(2)];
} else {
    // Unix系统直接执行
    command = 'bash';
    args = [scriptPath, ...process.argv.slice(2)];
}

// 检查Node.js环境
function checkNodeEnvironment() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 14) {
        console.error('❌ 错误: 需要Node.js 14.0.0或更高版本');
        console.error(`当前版本: ${nodeVersion}`);
        process.exit(1);
    }
}

// 执行脚本
function executeScript() {
    const child = spawn(command, args, {
        stdio: 'inherit',
        shell: isWindows,
        cwd: process.cwd()
    });

    child.on('error', (error) => {
        if (error.code === 'ENOENT') {
            console.log('⚠️  bash环境不可用，切换到Node.js版本...');
            console.log('');
            
            // 尝试使用Node.js版本
            const nodePath = path.join(__dirname, 'iconfontify-node.js');
            if (fs.existsSync(nodePath)) {
                console.log('🔄 使用纯Node.js版本执行...');
                
                const nodeChild = spawn('node', [nodePath, ...process.argv.slice(2)], {
                    stdio: 'inherit',
                    cwd: process.cwd()
                });
                
                nodeChild.on('error', (nodeError) => {
                    console.error('❌ Node.js版本执行失败:', nodeError.message);
                    process.exit(1);
                });
                
                nodeChild.on('close', (nodeCode) => {
                    process.exit(nodeCode);
                });
            } else {
                console.error('❌ 错误: 无法找到bash执行环境');
                console.error('');
                
                if (isWindows) {
                    console.error('Windows用户请安装以下任一工具：');
                    console.error('1. Git for Windows (推荐): https://git-scm.com/download/win');
                    console.error('2. WSL (Windows Subsystem for Linux)');
                    console.error('3. 或者使用: npx iconfontify --node');
                } else {
                    console.error('请确保系统已安装bash');
                }
                process.exit(1);
            }
        } else {
            console.error('❌ 执行错误:', error.message);
            process.exit(1);
        }
    });

    child.on('close', (code) => {
        process.exit(code);
    });
}

// 显示帮助信息
function showHelp() {
    console.log(`
🎨 iconfontify - SVG图标转字体工具

用法: npx iconfontify [选项]

选项:
  -i <目录>    指定输入目录 (默认: icon)
  -o <目录>    指定输出目录 (默认: build/iconfont)
  -n <名称>    指定字体名称 (默认: iconfont)
  -h           生成HTML+CSS预览文件
  --help       显示此帮助信息

示例:
  npx iconfontify                           # 使用默认设置构建
  npx iconfontify -i svg-icons -o dist      # 指定输入和输出目录
  npx iconfontify -n myicons                # 指定字体名称
  npx iconfontify -h                        # 生成HTML预览
  npx iconfontify -i icons -o build -n myicons -h # 完整自定义配置

环境要求:
  - Node.js >= 14.0.0
  - 项目目录下需要有SVG图标文件
  
Windows用户注意:
  本工具需要bash环境，请安装Git for Windows或WSL

更多信息: https://github.com/your-username/iconfontify
`);
}

// 主程序
function main() {
    // 检查是否显示帮助
    if (process.argv.includes('--help') || process.argv.includes('-help')) {
        showHelp();
        return;
    }
    
    checkNodeEnvironment();
    
    // // 检查是否在正确的目录（应该包含package.json）
    // const packageJsonPath = path.join(process.cwd(), 'package.json');
    // if (!fs.existsSync(packageJsonPath)) {
    //     console.log('⚠️  警告: 当前目录未找到package.json文件');
    //     console.log('请确保在项目根目录下运行此命令');
    //     console.log('');
    // }
    
    // 检查是否有图标目录
    const defaultIconDir = path.join(process.cwd(), 'icon');
    if (!fs.existsSync(defaultIconDir)) {
        console.log('💡 提示: 未找到默认的icon目录');
        console.log('请确保SVG图标文件放在正确的目录中');
        console.log('或使用 -i 参数指定图标目录');
        console.log('');
    }
    
    executeScript();
}

// 运行主程序
main(); 