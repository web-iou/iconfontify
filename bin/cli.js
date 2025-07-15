#!/usr/bin/env node

/**
 * iconfontify CLI 入口
 * 适用于npm包发布
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 获取脚本目录
const binDir = __dirname;
const isWindows = process.platform === 'win32';

// 检查参数
const args = process.argv.slice(2);
const useNodeVersion = true;

// 显示版本信息
if (args.includes('--version') || args.includes('-v')) {
    try {
        const packagePath = path.join(binDir, '..', 'package.json');
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        console.log(`iconfontify v${pkg.version}`);
    } catch (error) {
        console.log('iconfontify v1.0.0');
    }
    process.exit(0);
}

// 显示帮助信息
if (args.includes('--help') || args.includes('-h') && args.length === 1) {
    console.log(`
🎨 iconfontify - SVG图标转字体工具

用法: 
  npx iconfontify [选项]

选项:
  -i <目录>     指定输入目录 (默认: icon)
  -o <目录>     指定输出目录 (默认: build/iconfont)  
  -n <名称>     指定字体名称 (默认: iconfont)
  --iconmap <文件> 指定图标映射JSON文件路径 (默认: 使用-o目录下的icon-mapping.json)
  -h            生成HTML+CSS预览文件
  --node        强制使用Node.js版本（Windows推荐）
  --help        显示此帮助信息
  --version     显示版本信息

示例:
  npx iconfontify                     # 默认构建
  npx iconfontify -i svg -o dist      # 自定义目录
  npx iconfontify -n myicons          # 自定义字体名称
  npx iconfontify -i svg -n myicons -h # 自定义目录、名称并生成预览
  npx iconfontify --iconmap icons.json # 使用指定的图标映射文件
  npx iconfontify --node              # 使用Node.js版本

环境要求:
  - Node.js >= 14.0.0
  - SVG图标文件

注意: Windows用户建议使用 --node 参数
`);
    process.exit(0);
}

// 执行逻辑
function executeCommand() {
    let scriptPath;
    let command;
    let scriptArgs;

    if (useNodeVersion) {
        // 使用Node.js版本
        scriptPath = path.join(binDir, 'iconfontify-node.js');
        command = 'node';
        scriptArgs = [scriptPath, ...args.filter(arg => arg !== '--node')];
        
        console.log('🔧 使用Node.js版本执行...');
    } else {
        // 尝试使用bash版本
        scriptPath = path.join(binDir, 'build-icons.sh');
        
        if (isWindows) {
            // Windows下查找bash
            const gitBashPaths = [
                'C:\\Program Files\\Git\\bin\\bash.exe',
                'C:\\Program Files (x86)\\Git\\bin\\bash.exe'
            ];
            
            let bashPath = gitBashPaths.find(p => fs.existsSync(p)) || 'bash';
            command = bashPath;
            scriptArgs = [scriptPath, ...args];
            
            console.log('🔧 使用bash版本执行...');
        } else {
            command = 'bash';
            scriptArgs = [scriptPath, ...args];
        }
    }

    // 检查脚本是否存在
    if (!fs.existsSync(scriptPath)) {
        console.error(`❌ 错误: 找不到脚本文件 ${path.basename(scriptPath)}`);
        console.error('请确保npm包完整安装');
        process.exit(1);
    }

    // 执行脚本
    const child = spawn(command, scriptArgs, {
        stdio: 'inherit',
        shell: isWindows,
        cwd: process.cwd()
    });

    child.on('error', (error) => {
        if (error.code === 'ENOENT' && !useNodeVersion) {
            console.log('⚠️  bash不可用，切换到Node.js版本...');
            
            // 重新执行Node.js版本
            process.argv.push('--node');
            executeCommand();
        } else {
            console.error('❌ 执行失败:', error.message);
            
            if (isWindows && !useNodeVersion) {
                console.log('');
                console.log('💡 Windows用户建议使用: npx iconfontify --node');
            }
            
            process.exit(1);
        }
    });

    child.on('close', (code) => {
        process.exit(code || 0);
    });
}

// 运行
executeCommand(); 