const fs = require('fs');
const path = require('path');

// 尝试多种方式加载webfont
let webfont;
try {
  webfont = require('webfont').default;
} catch (error) {
  try {
    // 尝试从脚本目录的node_modules加载
    webfont = require(path.join(__dirname, 'node_modules', 'webfont')).default;
  } catch (error2) {
    try {
      // 尝试从上级目录的node_modules加载
      webfont = require(path.join(__dirname, '..', 'node_modules', 'webfont')).default;
    } catch (error3) {
      try {
        // 尝试从当前工作目录的node_modules加载
        webfont = require(path.join(process.cwd(), 'node_modules', 'webfont')).default;
      } catch (error4) {
        try {
          // 尝试其他导入方式
          const webfontModule = require('webfont');
          webfont = webfontModule.default || webfontModule;
        } catch (error5) {
          console.error('❌ 无法加载webfont依赖');
          console.error('错误信息:', error.message);
          console.error('');
          console.error('解决方案:');
          console.error('1. 检查webfont是否已安装: npm list webfont');
          console.error('2. 重新安装依赖: npm install webfont');
          console.error('3. 或在项目目录执行: npm install webfont');
          process.exit(1);
        }
      }
    }
  }
}

// 获取输入目录模式 - 优先使用环境变量，然后使用默认值
function getInputPattern() {
  if (process.env.ICONFONTIFY_INPUT_DIR) {
    const cwd = process.env.ICONFONTIFY_CWD || process.cwd();
    return path.join(cwd, process.env.ICONFONTIFY_INPUT_DIR, '*.svg').replace(/\\/g, '/');
  }
  return 'icon/*.svg';
}

// 获取输出目录 - 优先使用环境变量，然后使用默认值
function getOutputDir() {
  if (process.env.ICONFONTIFY_OUTPUT_DIR) {
    const cwd = process.env.ICONFONTIFY_CWD || process.cwd();
    return path.join(cwd, process.env.ICONFONTIFY_OUTPUT_DIR);
  }
  return path.join(__dirname, 'build', 'iconfont');
}

// 获取字体名称 - 优先使用环境变量，然后使用默认值
function getFontName() {
  return process.env.ICONFONTIFY_FONT_NAME || 'iconfont';
}

async function generateFont() {
  const inputPattern = getInputPattern();
  const outputDir = getOutputDir();
  const fontName = getFontName();
  
  const result = await webfont({
    files: inputPattern,
    fontName: fontName,
    formats: ['ttf'],
    fontHeight: 1024,         // 标准字体高度
    descent: 200,             // 增加下沉值改善基线对齐
    normalize: true,          // 标准化图标尺寸
    round: 10e12,            // 更高精度的舍入
    centerHorizontally: true, // 水平居中
    fixedWidth: false,        // 禁用固定宽度，保持图标比例
    fontWeight: 400,
    fontStyle: 'normal',
    metadata: 'Generated icon font', // 添加字体元数据
    prependUnicode: false,    // 不在文件名前添加Unicode
    startUnicode: 0xE001,     // 设置起始Unicode码点
    verbose: true             // 详细输出便于调试
  });

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 保存字体文件
  for (const format of ['ttf']) {
    if (result[format]) {
      fs.writeFileSync(
        path.join(outputDir, `${fontName}.${format}`),
        result[format]
      );
    }
  }

  // 生成文件名到Unicode point的映射
  const iconMapping = {};
  const cssRules = [];
  
  if (result.glyphsData) {
    console.log(`✅ 处理 ${result.glyphsData.length} 个图标的Unicode映射`);
    
    result.glyphsData.forEach((glyph, index) => {
      if (glyph && glyph.metadata) {
        const iconName = glyph.metadata.name;
        
        // 使用私有使用区域的Unicode值（E000-F8FF），从E001开始
        const unicodePoint = 0xE001 + index;
        
        console.log(`📍 ${iconName} -> U+${unicodePoint.toString(16).toUpperCase().padStart(4, '0')}`);
        
        if (iconName && unicodePoint) {
          const unicodeHex = unicodePoint.toString(16).toUpperCase();
          
          // 添加到映射对象
          iconMapping[iconName] = {
            unicode: unicodePoint,
            hex: `\\${unicodeHex}`,
            codePoint: `U+${unicodeHex.padStart(4, '0')}`
          };
          
          // 生成CSS规则
          cssRules.push(`.icon-${iconName}:before {
  content: "\\${unicodeHex}";
}`);
        }
      }
    });
  }

  // 生成映射JSON文件
  fs.writeFileSync(
    path.join(outputDir, 'icon-mapping.json'), 
    JSON.stringify(iconMapping, null, 2)
  );

}

generateFont().catch(console.error);

