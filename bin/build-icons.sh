#!/bin/bash

# 图标字体构建脚本
# 此脚本会依次执行SVG图标清理和字体生成

# 设置错误处理 - 遇到任何错误立即退出
set -e

# 获取脚本所在目录（包的安装目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_ROOT="$(dirname "$SCRIPT_DIR")"

# 默认配置
INPUT_DIR="icon"
OUTPUT_DIR="build/iconfont"
GENERATE_HTML=false
FONT_NAME="iconfont"

# 显示帮助信息
show_help() {
    cat << EOF
图标字体构建工具

用法: $0 [选项]

选项:
  -i <目录>    指定输入目录 (默认: icon)
  -o <目录>    指定输出目录 (默认: build/iconfont)
  -n <名称>    指定字体名称 (默认: iconfont)
  -h           生成HTML+CSS预览文件
  --help       显示此帮助信息

示例:
  $0                           # 使用默认设置构建
  $0 -i svg-icons -o dist      # 指定输入和输出目录
  $0 -n myicons                # 指定字体名称
  $0 -h                        # 生成HTML预览
  $0 -i icons -o build -n myicons -h # 完整自定义配置

EOF
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -i)
                INPUT_DIR="$2"
                shift 2
                ;;
            -o)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            -n|--name)
                FONT_NAME="$2"
                shift 2
                ;;
            -h)
                GENERATE_HTML=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo "错误: 未知参数 '$1'"
                echo "使用 '$0 --help' 查看帮助信息"
                exit 1
                ;;
        esac
    done
}

# 打印函数
print_header() {
    echo "================================================"
    echo "🚀 $1"
    echo "================================================"
}

print_step() {
    echo ""
    echo "📋 $1"
    echo "----------------------------------------"
}

print_success() {
    echo ""
    echo "✅ $1"
}

print_error() {
    echo ""
    echo "❌ $1"
}

# 检查Node.js环境
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js未安装，请先安装Node.js"
        exit 1
    fi
    echo "Node.js版本: $(node --version)"
}

# 检查必要的依赖
check_dependencies() {
    # 检查当前目录是否有必要的依赖包
    if [ -d "node_modules/webfont" ] && [ -d "node_modules/svgo" ]; then
        echo "依赖检查通过"
        return 0
    fi
    
    print_step "检测到缺少必要依赖，正在安装..."
    
    # 如果没有package.json，先创建一个
    if [ ! -f "package.json" ]; then
        print_step "初始化package.json..."
        npm init -y
    fi
    
    # 安装必要的依赖
    print_step "安装webfont和svgo..."
    if npm install webfont svgo; then
        print_success "依赖安装完成"
        
        # 验证依赖安装是否成功
        if [ -d "node_modules/webfont" ] && [ -d "node_modules/svgo" ]; then
            print_success "依赖验证通过"
        else
            print_error "依赖安装后仍无法找到包文件"
            exit 1
        fi
    else
        print_error "依赖安装失败"
        echo "请手动运行: npm init -y && npm install webfont svgo"
        exit 1
    fi
}

# 检查源文件是否存在
check_source_files() {
    CLEAN_ICONS_PATH="$PACKAGE_ROOT/clean-icons.js"
    GENERATE_FONT_PATH="$PACKAGE_ROOT/generate-font.js"
    
    if [ ! -f "$CLEAN_ICONS_PATH" ]; then
        print_error "clean-icons.js文件不存在"
        echo "查找路径: $CLEAN_ICONS_PATH"
        echo "请确保包安装正确"
        exit 1
    fi
    
    if [ ! -f "$GENERATE_FONT_PATH" ]; then
        print_error "generate-font.js文件不存在"
        echo "查找路径: $GENERATE_FONT_PATH"
        echo "请确保包安装正确"
        exit 1
    fi
    
    if [ ! -d "$INPUT_DIR" ]; then
        print_error "输入目录 '$INPUT_DIR' 不存在"
        exit 1
    fi
    
    # 检查是否有SVG文件
    svg_count=$(find "$INPUT_DIR" -name "*.svg" | wc -l)
    if [ "$svg_count" -eq 0 ]; then
        print_error "输入目录 '$INPUT_DIR' 中没有找到SVG文件"
        exit 1
    fi
    
    echo "找到 $svg_count 个SVG图标文件"
}

# 创建输出目录
create_output_dir() {
    if [ ! -d "$OUTPUT_DIR" ]; then
        print_step "创建输出目录..."
        mkdir -p "$OUTPUT_DIR"
        print_success "输出目录已创建: $OUTPUT_DIR"
    fi
}

# 清理之前的构建结果
clean_build() {
    if [ -d "$OUTPUT_DIR" ]; then
        print_step "清理之前的构建结果..."
        rm -rf "$OUTPUT_DIR"/*
        print_success "构建目录已清理"
    fi
}

# 更新脚本中的路径配置
update_script_paths() {
    CLEAN_ICONS_PATH="$PACKAGE_ROOT/clean-icons.js"
    GENERATE_FONT_PATH="$PACKAGE_ROOT/generate-font.js"
    
    # 复制脚本到当前目录并修改路径
    cp "$CLEAN_ICONS_PATH" clean-icons.js.tmp
    cp "$GENERATE_FONT_PATH" generate-font.js.tmp
    
    # 修改clean-icons.js中的输入路径，使用当前工作目录
    sed -i.bak "s|path\.join(__dirname, 'icon')|path.join(process.cwd(), '$INPUT_DIR')|g" clean-icons.js.tmp
    
    # 修改generate-font.js中的输入和输出路径
    sed -i.bak "s|'icon/\*\.svg'|'$INPUT_DIR/*.svg'|g" generate-font.js.tmp
    sed -i.bak "s|path\.join(__dirname, 'build', 'iconfont')|path.join(process.cwd(), '$OUTPUT_DIR')|g" generate-font.js.tmp
}

# 恢复脚本原始配置
restore_script_paths() {
    if [ -f "clean-icons.js.tmp" ]; then
        rm -f clean-icons.js.tmp clean-icons.js.tmp.bak
    fi
    
    if [ -f "generate-font.js.tmp" ]; then
        rm -f generate-font.js.tmp generate-font.js.tmp.bak
    fi
}

# 执行SVG清理
clean_svg_icons() {
    print_step "步骤1: 清理SVG图标"
    
    # 设置环境变量
    export ICONFONTIFY_INPUT_DIR="$INPUT_DIR"
    export ICONFONTIFY_OUTPUT_DIR="$OUTPUT_DIR"
    export ICONFONTIFY_FONT_NAME="$FONT_NAME"
    export ICONFONTIFY_CWD="$(pwd)"
    
    if node clean-icons.js.tmp; then
        print_success "SVG图标清理完成"
    else
        print_error "SVG图标清理失败"
        exit 1
    fi
}

# 生成字体文件
generate_font_files() {
    print_step "步骤2: 生成字体文件"
    
    # 设置环境变量
    export ICONFONTIFY_INPUT_DIR="$INPUT_DIR"
    export ICONFONTIFY_OUTPUT_DIR="$OUTPUT_DIR"
    export ICONFONTIFY_FONT_NAME="$FONT_NAME"
    export ICONFONTIFY_CWD="$(pwd)"
    
    if node generate-font.js.tmp; then
        print_success "字体文件生成完成"
    else
        print_error "字体文件生成失败"
        exit 1
    fi
}

# 生成HTML预览
generate_html_preview() {
    if [ "$GENERATE_HTML" = true ]; then
        print_step "步骤3: 生成HTML预览"
        
        # 检查是否存在映射文件
        if [ ! -f "$OUTPUT_DIR/icon-mapping.json" ]; then
            print_error "找不到icon-mapping.json文件，无法生成预览"
            return 1
        fi
        
        # 生成HTML预览文件
        cat > "$OUTPUT_DIR/preview.html" << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>图标字体预览</title>
    <style>
        @font-face {
            font-family: 'iconfont';
            src: url('icons.ttf') format('truetype');
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
            <p>点击任意图标复制CSS类名或Unicode</p>
            
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
                <pre>&lt;i class="icon-home"&gt;&lt;/i&gt;
&lt;span class="icon-user"&gt;&lt;/span&gt;</pre>
            </div>
            
            <h3>3. 直接使用Unicode</h3>
            <div class="usage-example">
                <pre>.my-icon::before {
  font-family: 'iconfont';
  content: '\E001';
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
                    fetch('icons.ttf')
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
                        const className = `icon-${iconName}`;
                        const unicodeChar = String.fromCharCode(iconData.unicode);
                        
                        const iconCard = document.createElement('div');
                        iconCard.className = 'icon-card';
                        iconCard.innerHTML = `
                            <div class="icon-display" style="font-family: 'iconfont';">${unicodeChar}</div>
                            <div class="icon-name">${iconName}</div>
                            <div class="icon-unicode">${iconData.codePoint}</div>
                            <div class="icon-class">.${className}</div>
                        `;
                        
                        // 点击复制功能
                        iconCard.addEventListener('click', () => {
                            copyToClipboard(`.${className}`);
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
</html>
EOF
        
        print_success "HTML预览文件已生成: $OUTPUT_DIR/preview.html"
    fi
}

# 显示构建结果
show_results() {
    print_step "构建结果"
    
    if [ -d "$OUTPUT_DIR" ]; then
        echo "输出目录: $OUTPUT_DIR/"
        echo ""
        echo "生成的文件:"
        
        cd "$OUTPUT_DIR"
        for file in *; do
            if [ -f "$file" ]; then
                size=$(du -h "$file" | cut -f1)
                echo "  📄 $file ($size)"
            fi
        done
        cd - > /dev/null
        
        # 检查映射文件
        if [ -f "$OUTPUT_DIR/icon-mapping.json" ]; then
            mapping_count=$(node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync('$OUTPUT_DIR/icon-mapping.json','utf8')); console.log(Object.keys(data).length);")
            echo ""
            echo "Unicode映射: $mapping_count 个图标"
        fi
        
        # 如果生成了HTML预览，显示访问信息
        if [ -f "$OUTPUT_DIR/preview.html" ]; then
            echo ""
            echo "🌐 HTML预览: file://$(pwd)/$OUTPUT_DIR/preview.html"
        fi
    else
        print_error "构建目录不存在"
        exit 1
    fi
}

# 主函数
main() {
    # 解析命令行参数
    parse_args "$@"
    
    print_header "图标字体构建工具"
    echo "输入目录: $INPUT_DIR"
    echo "输出目录: $OUTPUT_DIR"
    echo "生成HTML预览: $([ "$GENERATE_HTML" = true ] && echo "是" || echo "否")"
    
    # 检查环境和依赖
    print_step "环境检查"
    check_node
    check_dependencies
    check_source_files
    
    # 创建和清理输出目录
    create_output_dir
    clean_build
    
    # 更新脚本路径配置
    update_script_paths
    
    # 设置清理陷阱
    trap 'restore_script_paths; print_error "构建过程中发生错误，请检查上面的错误信息"; exit 1' ERR
    
    # 执行构建步骤
    clean_svg_icons
    generate_font_files
    
    # 生成HTML预览（如果需要）
    generate_html_preview
    
    # 恢复脚本原始配置
    restore_script_paths
    
    # 显示结果
    show_results
    
    print_header "构建完成！"
    echo "🎉 图标字体已成功生成到 $OUTPUT_DIR/ 目录"
    echo ""
    echo "使用说明:"
    echo "  1. 将$OUTPUT_DIR/目录下的文件复制到你的项目中"
    echo "  2. 引入CSS文件或查看映射文件了解使用方法"
    echo "  3. 查看icon-mapping.json文件获取完整的Unicode映射"
    if [ "$GENERATE_HTML" = true ]; then
        echo "  4. 打开preview.html文件查看图标预览"
    fi
}

# 错误处理
trap 'print_error "构建过程中发生错误，请检查上面的错误信息"; exit 1' ERR

# 运行主函数
main "$@" 