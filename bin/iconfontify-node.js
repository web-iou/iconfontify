#!/usr/bin/env node

/**
 * iconfontify - 纯Node.js版本
 * 不依赖bash环境的SVG图标转字体工具
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 获取包的根目录（脚本文件位置）
const packageRoot = path.dirname(__dirname);

// 默认配置
let INPUT_DIR = 'icon';
let OUTPUT_DIR = 'build/iconfont';
let GENERATE_HTML = false;
let FONT_NAME = 'iconfont';

// 显示帮助信息
function showHelp() {
    console.log(`
🎨 iconfontify - SVG图标转字体工具 (Node.js版本)

用法: npx iconfontify [选项]

选项:
  -i <目录>    指定输入目录 (默认: icon)
  -o <目录>    指定输出目录 (默认: build/iconfont)
  -n <名称>    指定字体名称 (默认: iconfont)
  -h           生成HTML+CSS预览文件
  --help       显示此帮助信息
  --node       强制使用Node.js版本（无需bash）

示例:
  npx iconfontify --node                    # 使用Node.js版本构建
  npx iconfontify --node -i svg-icons       # 指定输入目录
  npx iconfontify --node -n myicons         # 指定字体名称
  npx iconfontify --node -h                 # 生成HTML预览

环境要求:
  - Node.js >= 14.0.0
  - 项目中需要有clean-icons.js和generate-font.js文件
  
注意: 此版本直接运行Node.js脚本，无需bash环境
`);
}

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '-i':
                if (i + 1 < args.length) {
                    INPUT_DIR = args[i + 1];
                    i++;
                } else {
                    console.error('❌ 错误: -i 参数需要指定目录');
                    process.exit(1);
                }
                break;
            case '-o':
                if (i + 1 < args.length) {
                    OUTPUT_DIR = args[i + 1];
                    i++;
                } else {
                    console.error('❌ 错误: -o 参数需要指定目录');
                    process.exit(1);
                }
                break;
            case '-n':
            case '--name':
                if (i + 1 < args.length) {
                    FONT_NAME = args[i + 1];
                    i++;
                } else {
                    console.error('❌ 错误: -n 参数需要指定字体名称');
                    process.exit(1);
                }
                break;
            case '-h':
                GENERATE_HTML = true;
                break;
            case '--help':
                showHelp();
                process.exit(0);
                break;
            case '--node':
                // 标识使用Node.js版本，已经在此脚本中
                break;
            default:
                console.error(`❌ 错误: 未知参数 '${args[i]}'`);
                console.error("使用 'npx iconfontify --help' 查看帮助信息");
                process.exit(1);
        }
    }
}

// 打印函数
function printHeader(message) {
    console.log('================================================');
    console.log(`🚀 ${message}`);
    console.log('================================================');
}

function printStep(message) {
    console.log('');
    console.log(`📋 ${message}`);
    console.log('----------------------------------------');
}

function printSuccess(message) {
    console.log('');
    console.log(`✅ ${message}`);
}

function printError(message) {
    console.log('');
    console.log(`❌ ${message}`);
}

// 检查Node.js环境
function checkNodeEnvironment() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 14) {
        printError('需要Node.js 14.0.0或更高版本');
        console.error(`当前版本: ${nodeVersion}`);
        process.exit(1);
    }
    console.log(`Node.js版本: ${nodeVersion}`);
}

// 检查依赖
function checkDependencies() {
    const missingDeps = [];
    
    // 检查webfont
    try {
        require('webfont');
    } catch (error) {
        try {
            // 尝试从包目录加载
            require(path.join(packageRoot, 'node_modules', 'webfont'));
        } catch (error2) {
            missingDeps.push('webfont');
        }
    }
    
    // 检查svgo
    try {
        require('svgo');
    } catch (error) {
        try {
            // 尝试从包目录加载
            require(path.join(packageRoot, 'node_modules', 'svgo'));
        } catch (error2) {
            missingDeps.push('svgo');
        }
    }
    
    if (missingDeps.length === 0) {
        console.log('依赖检查通过');
        return;
    }
    
    printError(`缺失依赖: ${missingDeps.join(', ')}`);
    console.log('');
    console.log('正在尝试自动安装缺失的依赖...');
    
         // 尝试自动安装缺失的依赖
     try {
         const installCmd = `npm install ${missingDeps.join(' ')}`;
         console.log(`执行: ${installCmd}`);
         
         execSync(installCmd, { 
             cwd: process.cwd(),
             stdio: 'inherit'
         });
         
         printSuccess('依赖安装完成');
     } catch (installError) {
        printError('自动安装失败');
        console.log('');
        console.log('请手动安装缺失的依赖：');
        console.log(`npm install ${missingDeps.join(' ')}`);
        console.log('');
        console.log('或者使用全局安装：');
        console.log('npm install -g iconfontify');
        process.exit(1);
    }
}

// 检查源文件
function checkSourceFiles() {
    const cleanIconsPath = path.join(packageRoot, 'clean-icons.js');
    const generateFontPath = path.join(packageRoot, 'generate-font.js');
    
    if (!fs.existsSync(cleanIconsPath)) {
        printError('clean-icons.js文件不存在');
        console.log(`查找路径: ${cleanIconsPath}`);
        console.log('请确保包安装正确');
        process.exit(1);
    }
    
    if (!fs.existsSync(generateFontPath)) {
        printError('generate-font.js文件不存在');
        console.log(`查找路径: ${generateFontPath}`);
        console.log('请确保包安装正确');
        process.exit(1);
    }
    
    if (!fs.existsSync(INPUT_DIR)) {
        printError(`输入目录 '${INPUT_DIR}' 不存在`);
        console.log('请创建图标目录并放入SVG文件，或使用-i参数指定正确的目录');
        process.exit(1);
    }
    
    // 检查SVG文件
    const files = fs.readdirSync(INPUT_DIR);
    const svgFiles = files.filter(file => path.extname(file) === '.svg');
    
    if (svgFiles.length === 0) {
        printError(`输入目录 '${INPUT_DIR}' 中没有找到SVG文件`);
        process.exit(1);
    }
    
    console.log(`找到 ${svgFiles.length} 个SVG图标文件`);
}

// 创建输出目录
function createOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        printStep('创建输出目录...');
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        printSuccess(`输出目录已创建: ${OUTPUT_DIR}`);
    }
}

// 清理构建目录
function cleanBuild() {
    if (fs.existsSync(OUTPUT_DIR)) {
        printStep('清理之前的构建结果...');
        const files = fs.readdirSync(OUTPUT_DIR);
        for (const file of files) {
            fs.unlinkSync(path.join(OUTPUT_DIR, file));
        }
        printSuccess('构建目录已清理');
    }
}

// 更新脚本中的路径配置
function updateScriptPaths() {
    // 设置环境变量供generate-font.js使用
    process.env.ICONFONTIFY_INPUT_DIR = INPUT_DIR;
    process.env.ICONFONTIFY_OUTPUT_DIR = OUTPUT_DIR;
    process.env.ICONFONTIFY_FONT_NAME = FONT_NAME;
    process.env.ICONFONTIFY_CWD = process.cwd();
    process.env.ICONFONTIFY_PACKAGE_ROOT = packageRoot;
}

// 恢复脚本
function restoreScripts() {
    // 清理环境变量
    delete process.env.ICONFONTIFY_INPUT_DIR;
    delete process.env.ICONFONTIFY_OUTPUT_DIR;
    delete process.env.ICONFONTIFY_FONT_NAME;
    delete process.env.ICONFONTIFY_CWD;
    delete process.env.ICONFONTIFY_PACKAGE_ROOT;
}

// 执行Node.js脚本
async function executeNodeScript(scriptName, displayName) {
    return new Promise((resolve, reject) => {
        const { spawn } = require('child_process');
        const scriptPath = path.join(packageRoot, `${scriptName}`);
        
        if (!fs.existsSync(scriptPath)) {
            printError(`脚本文件不存在: ${scriptPath}`);
            reject(new Error(`Script not found: ${scriptPath}`));
            return;
        }
        
        const child = spawn('node', [scriptPath], {
            stdio: 'inherit',
            cwd: process.cwd(),
            env: { ...process.env } // 传递所有环境变量包括我们设置的
        });
        
        child.on('error', (error) => {
            printError(`${displayName}执行失败: ${error.message}`);
            reject(error);
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                printSuccess(`${displayName}完成`);
                resolve();
            } else {
                printError(`${displayName}失败`);
                reject(new Error(`Exit code: ${code}`));
            }
        });
    });
}

// 生成HTML预览
async function generateHTMLPreview() {
    printStep('生成HTML预览');
    
    const mappingFile = path.join(OUTPUT_DIR, 'icon-mapping.json');
    if (!fs.existsSync(mappingFile)) {
        printError('找不到icon-mapping.json文件，无法生成预览');
        return;
    }
    
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>图标字体预览 - ${FONT_NAME}</title>
    <style>
        @font-face {
            font-family: '${FONT_NAME}';
            src: url('${FONT_NAME}.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
            font-display: block;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f7;
            color: #1d1d1f;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 60px;
        }
        
        .header h1 {
            font-size: 3em;
            font-weight: 700;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .header p {
            font-size: 1.2em;
            color: #6e6e73;
        }
        
        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 30px 0;
            flex-wrap: wrap;
        }
        
        .stat-item {
            background: white;
            padding: 20px 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #007aff;
        }
        
        .stat-label {
            color: #6e6e73;
            margin-top: 5px;
        }
        
        .icon-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 40px;
        }
        
        .icon-card {
            background: white;
            border-radius: 16px;
            padding: 30px 20px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
        }
        
        .icon-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        }
        
        .icon-display {
            font-size: 48px;
            margin-bottom: 15px;
            color: #007aff;
        }
        
        .icon-name {
            font-weight: 600;
            color: #1d1d1f;
            margin-bottom: 8px;
            font-size: 1.1em;
        }
        
        .icon-unicode {
            font-family: 'Monaco', 'Menlo', monospace;
            color: #6e6e73;
            font-size: 0.9em;
            background: #f5f5f7;
            padding: 4px 8px;
            border-radius: 6px;
            margin-bottom: 8px;
        }
        
        .icon-class {
            font-family: 'Monaco', 'Menlo', monospace;
            color: #007aff;
            font-size: 0.85em;
            background: #e3f2ff;
            padding: 4px 8px;
            border-radius: 6px;
        }
        
        .copy-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #34c759;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 500;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .copy-notification.show {
            opacity: 1;
            transform: translateX(0);
        }
        
        .usage-section {
            background: white;
            border-radius: 16px;
            padding: 40px;
            margin: 60px 0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        
        .usage-section h2 {
            font-size: 2em;
            margin-bottom: 20px;
            color: #1d1d1f;
        }
        
        .usage-example {
            background: #f5f5f7;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            font-family: 'Monaco', 'Menlo', monospace;
            overflow-x: auto;
        }
        
        .usage-example pre {
            margin: 0;
            color: #1d1d1f;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 20px 15px;
            }
            
            .header h1 {
                font-size: 2em;
            }
            
            .icon-grid {
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                gap: 15px;
            }
            
            .icon-card {
                padding: 20px 15px;
            }
            
            .icon-display {
                font-size: 36px;
            }
            
            .stats {
                gap: 15px;
            }
            
            .stat-item {
                padding: 15px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>图标字体预览</h1>
            <p>点击任意图标复制CSS类名</p>
            
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-number" id="icon-count">0</div>
                    <div class="stat-label">图标总数</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" id="font-size">--</div>
                    <div class="stat-label">字体大小</div>
                </div>
            </div>
        </div>
        
        <div class="usage-section">
            <h2>使用方法</h2>
            
            <h3>1. 引入字体文件</h3>
            <div class="usage-example">
                <pre>@font-face {
  font-family: '${FONT_NAME}';
  src: url('${FONT_NAME}.ttf') format('truetype');
}

.icon {
  font-family: '${FONT_NAME}' !important;
  speak: never;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
}</pre>
            </div>
            
            <h3>2. 使用CSS类名</h3>
            <div class="usage-example">
                <pre>&lt;i class="icon icon-home"&gt;&lt;/i&gt;
&lt;span class="icon icon-user"&gt;&lt;/span&gt;</pre>
            </div>
            
            <h3>3. 直接使用Unicode</h3>
            <div class="usage-example">
                <pre>.my-icon::before {
  font-family: '${FONT_NAME}';
  content: '\\E001';
}</pre>
            </div>
        </div>
        
        <div class="icon-grid" id="icon-grid">
            <!-- 图标将通过JavaScript动态生成 -->
        </div>
    </div>
    
    <div class="copy-notification" id="copy-notification">
        已复制到剪贴板！
    </div>
    
    <script>
        // 复制到剪贴板函数
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                showNotification();
            }).catch(err => {
                console.error('复制失败:', err);
                // 降级方案
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showNotification();
            });
        }
        
        // 显示复制通知
        function showNotification() {
            const notification = document.getElementById('copy-notification');
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
            }, 2000);
        }
        
        // 生成图标预览
        function generateIconPreview() {
            fetch('icon-mapping.json')
                .then(response => response.json())
                .then(mapping => {
                    const iconGrid = document.getElementById('icon-grid');
                    const iconCount = Object.keys(mapping).length;
                    
                    // 更新统计信息
                    document.getElementById('icon-count').textContent = iconCount;
                    
                    // 获取字体文件大小
                    fetch('${FONT_NAME}.ttf')
                        .then(response => response.blob())
                        .then(blob => {
                            const sizeInKB = (blob.size / 1024).toFixed(1);
                            document.getElementById('font-size').textContent = sizeInKB + 'K';
                        })
                        .catch(() => {
                            document.getElementById('font-size').textContent = '--';
                        });
                    
                    // 生成图标卡片
                    Object.entries(mapping).forEach(([iconName, iconData]) => {
                        const className = \`\${iconName}\`;
                        const unicodeChar = String.fromCharCode(iconData.unicode);
                        
                        const iconCard = document.createElement('div');
                        iconCard.className = 'icon-card';
                        iconCard.innerHTML = \`
                            <div class="icon-display" style="font-family: '${FONT_NAME}';">\${unicodeChar}</div>
                            <div class="icon-name">\${iconName}</div>
                            <div class="icon-unicode">\${iconData.codePoint}</div>
                            <div class="icon-class">.\${className}</div>
                        \`;
                        
                        // 点击复制功能
                        iconCard.addEventListener('click', () => {
                            copyToClipboard(\`.\${className}\`);
                        });
                        
                        iconGrid.appendChild(iconCard);
                    });
                })
                .catch(error => {
                    console.error('加载图标映射失败:', error);
                    document.getElementById('icon-grid').innerHTML = 
                        '<p style="text-align: center; color: #ff3b30; grid-column: 1 / -1;">无法加载图标数据</p>';
                });
        }
        
        // 页面加载完成后生成预览
        document.addEventListener('DOMContentLoaded', generateIconPreview);
    </script>
</body>
</html>`;
    
    const previewPath = path.join(OUTPUT_DIR, 'preview.html');
    fs.writeFileSync(previewPath, htmlContent);
    
    printSuccess(`HTML预览文件已生成: ${previewPath}`);
}

// 主函数
async function main() {
    try {
        parseArgs();
        
        printHeader('图标字体构建工具 (Node.js版本)');
        console.log(`输入目录: ${INPUT_DIR}`);
        console.log(`输出目录: ${OUTPUT_DIR}`);
        console.log(`字体名称: ${FONT_NAME}`);
        console.log(`生成HTML预览: ${GENERATE_HTML ? '是' : '否'}`);
        
        // 环境检查
        printStep('环境检查');
        checkNodeEnvironment();
        checkDependencies();
        checkSourceFiles();
        
        // 准备构建
        createOutputDir();
        // cleanBuild();
        updateScriptPaths();
        
        // 执行构建
        await executeNodeScript('clean-icons.js', 'SVG图标清理');
        await executeNodeScript('generate-font.js', '字体文件生成');
        
        // 生成HTML预览（如果需要）
        if (GENERATE_HTML) {
            await generateHTMLPreview();
        }
        
        // 清理临时文件
        restoreScripts();
        
        // 显示结果
        printStep('构建结果');
        console.log(`输出目录: ${OUTPUT_DIR}/`);
        console.log('');
        console.log('生成的文件:');
        
        const outputFiles = fs.readdirSync(OUTPUT_DIR);
        for (const file of outputFiles) {
            const filePath = path.join(OUTPUT_DIR, file);
            const stats = fs.statSync(filePath);
            const sizeKB = (stats.size / 1024).toFixed(1);
            console.log(`  📄 ${file} (${sizeKB}K)`);
        }
        
        // 检查映射文件
        const mappingFile = path.join(OUTPUT_DIR, 'icon-mapping.json');
        if (fs.existsSync(mappingFile)) {
            const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
            const iconCount = Object.keys(mapping).length;
            console.log('');
            console.log(`Unicode映射: ${iconCount} 个图标`);
        }
        
        printHeader('构建完成！');
        console.log(`🎉 图标字体已成功生成到 ${OUTPUT_DIR}/ 目录`);
        console.log('');
        console.log('使用说明:');
        console.log(`  1. 将${OUTPUT_DIR}/目录下的文件复制到你的项目中`);
        console.log('  2. 引入CSS文件或查看映射文件了解使用方法');
        console.log('  3. 查看icon-mapping.json文件获取完整的Unicode映射');
        if (GENERATE_HTML) {
            const previewPath = path.join(process.cwd(), OUTPUT_DIR, 'preview.html');
            console.log(`  4. 打开preview.html文件查看图标预览`);
            console.log(`     文件路径: file://${previewPath.replace(/\\/g, '/')}`);
        }
        
    } catch (error) {
        restoreScripts();
        printError(`构建失败: ${error.message}`);
        process.exit(1);
    }
}

// 运行主程序
main(); 