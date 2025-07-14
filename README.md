# SVG to Icon Font Generator

一个专业的SVG图标转字体工具，支持自动清理、优化SVG文件并生成高质量的字体文件。

## 📋 目录

- [特性](#-特性)
- [安装](#-安装)
- [快速开始](#-快速开始)
- [使用方法](#-使用方法)
- [命令行选项](#-命令行选项)
- [项目结构](#-项目结构)
- [配置说明](#-配置说明)
- [输出文件](#-输出文件)
- [使用示例](#-使用示例)
- [故障排除](#-故障排除)
- [开发说明](#-开发说明)

## ✨ 特性

- 🔧 **智能SVG清理**：自动移除背景、优化路径、保持图标比例
- 🎨 **高质量字体生成**：支持TTF格式，保持图标清晰度
- 📱 **完整的Unicode映射**：自动生成映射文件，支持多种使用方式
- 🎯 **防变形优化**：专门优化的SVGO配置，防止图标变形
- 🚀 **一键构建**：Shell脚本自动化整个构建流程
- 📂 **灵活的目录配置**：支持自定义输入输出目录
- 🌐 **HTML预览**：可选生成交互式预览页面

## 📦 安装

### 环境要求

- Node.js >= 14.0.0
- npm 或 yarn

### NPM包使用（推荐）

```bash
npx iconfontify
```

### 本地项目安装

```bash
npm install iconfontify --save-dev
```

### 全局安装

```bash
npm install -g iconfontify
```

安装后可以全局使用 `iconfontify` 命令。

## 🚀 快速开始

1. **准备SVG文件**
   
   将您的SVG图标文件放入 `icon/` 目录：
   ```
   icon/
   ├── home.svg
   ├── user.svg
   ├── search.svg
   └── ...
   ```

2. **运行构建**
   
   ```bash
   # 使用NPM包（推荐）
   npx iconfontify
   
   # Windows用户使用Node.js版本
   npx iconfontify --node
   
   # 本地项目使用
   ./bin/build-icons.sh
   ```

3. **查看输出**
   
   构建完成后，在 `build/iconfont/` 目录下查看生成的文件：
   ```
   build/iconfont/
   ├── icons.ttf          # 字体文件
   ├── icon-mapping.json  # Unicode映射
   └── preview.html       # 预览页面（如果使用 -h 参数）
   ```

## 🛠 使用方法

### 基本用法

```bash
# NPM包使用（推荐）
npx iconfontify

# 生成HTML预览
npx iconfontify -h

# 自定义输入输出目录
npx iconfontify -i svg-icons -o dist/fonts

# Windows用户使用Node.js版本
npx iconfontify --node -h

# 本地项目直接使用
./bin/build-icons.sh -i custom-icons -o output -h
```

### 分步执行

您也可以单独运行各个步骤：

```bash
# 1. 清理SVG文件
node clean-icons.js

# 2. 生成字体文件
node generate-font.js
```

## 📋 命令行选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-i <目录>` | 指定输入目录 | `icon` |
| `-o <目录>` | 指定输出目录 | `build/iconfont` |
| `-h` | 生成HTML+CSS预览文件 | 关闭 |
| `--node` | 强制使用Node.js版本（Windows推荐） | 自动检测 |
| `--help` | 显示帮助信息 | - |
| `--version` | 显示版本信息 | - |

### 使用示例

```bash
# 基本构建
npx iconfontify

# 指定自定义目录
npx iconfontify -i svg-files -o fonts

# 生成预览页面
npx iconfontify -h

# Windows用户推荐方式
npx iconfontify --node -i assets/icons -o dist/iconfont -h

# 本地项目构建
./bin/build-icons.sh -i assets/icons -o dist/iconfont -h
```

## 📁 项目结构

```
svg2iconfont/
├── bin/
│   └── build-icons.sh       # 主构建脚本
├── icon/                    # SVG图标目录
│   ├── home.svg
│   ├── user.svg
│   └── ...
├── build/                   # 构建输出目录
│   └── iconfont/
│       ├── icons.ttf
│       ├── icon-mapping.json
│       └── preview.html
├── clean-icons.js           # SVG清理脚本
├── generate-font.js         # 字体生成脚本
├── package.json
└── README.md
```

## ⚙️ 配置说明

### SVG清理配置

`clean-icons.js` 中的 SVGO 配置已优化，防止图标变形：

```javascript
const svgoConfig = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,        // 保持视图框
          convertShapeToPath: false,   // 禁用形状转路径
          collapseGroups: false,       // 禁用组合并
          mergePaths: false,           // 禁用路径合并
          convertTransform: false,     // 禁用变换转换
          cleanupNumericValues: {
            floatPrecision: 3          // 提高精度
          }
        }
      }
    }
    // ... 其他插件
  ]
};
```

### 字体生成配置

`generate-font.js` 中的字体生成参数：

```javascript
const result = await webfont({
  files: 'icon/*.svg',
  fontName: 'icons',
  formats: ['ttf'],
  fontHeight: 1024,              // 标准字体高度
  descent: 200,                  // 基线对齐
  normalize: true,               // 标准化图标尺寸
  round: 10e12,                  // 高精度舍入
  centerHorizontally: true,      // 水平居中
  fixedWidth: false,             // 保持图标比例
  startUnicode: 0xE001,          // 起始Unicode码点
  // ... 其他配置
});
```

## 📤 输出文件

### icons.ttf
字体文件，包含所有图标的字形定义。

### icon-mapping.json
Unicode映射文件，格式如下：

```json
{
  "home": {
    "unicode": 57345,
    "hex": "\\E001",
    "codePoint": "U+E001"
  },
  "user": {
    "unicode": 57346,
    "hex": "\\E002", 
    "codePoint": "U+E002"
  }
}
```

### preview.html（使用 -h 参数时生成）
交互式预览页面，包含：
- 所有图标的可视化展示
- 点击复制CSS类名功能
- Unicode信息显示
- 使用指南

## 💻 使用示例

### HTML中使用

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    @font-face {
      font-family: 'iconfont';
      src: url('icons.ttf') format('truetype');
    }
    
    .icon {
      font-family: 'iconfont';
      font-style: normal;
    }
  </style>
</head>
<body>
  <!-- 直接使用Unicode -->
  <span class="icon">&#xE001;</span>
  
  <!-- 通过CSS类（需要额外CSS定义） -->
  <i class="icon-home"></i>
</body>
</html>
```

### CSS定义

```css
@font-face {
  font-family: 'iconfont';
  src: url('icons.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

[class^="icon-"], [class*=" icon-"] {
  font-family: 'iconfont' !important;
  speak: never;
  font-style: normal;
  font-weight: normal;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
}

.icon-home:before { content: "\E001"; }
.icon-user:before { content: "\E002"; }
/* ... 更多图标 */
```

### JavaScript中使用

```javascript
// 加载映射文件
fetch('icon-mapping.json')
  .then(response => response.json())
  .then(mapping => {
    // 获取图标的Unicode值
    const homeIcon = String.fromCharCode(mapping.home.unicode);
    console.log(homeIcon); // 显示图标字符
  });
```

## 🔧 故障排除

### 常见问题

**Q: `npx iconfontify` 报错"系统找不到指定的路径"**
A: 这是Windows环境下的bash路径问题，请使用 `npx iconfontify --node`

**Q: 图标显示为方块或乱码**
A: 检查字体文件是否正确加载，确认@font-face路径正确。

**Q: 图标变形或比例异常**
A: SVG文件可能包含复杂的变换或嵌套结构，请检查原始SVG文件。

**Q: 构建失败**
A: 确保Node.js版本 >= 14，依赖已正确安装。

**Q: 找不到SVG文件**
A: 检查输入目录是否存在且包含.svg文件。

**Q: Windows用户bash环境问题**
A: 推荐使用 `--node` 参数，或安装Git for Windows获得bash环境。

### 调试方法

1. **检查Node.js环境**
   ```bash
   node --version
   npm --version
   ```

2. **验证依赖安装**
   ```bash
   npm list webfont svgo
   ```

3. **手动执行步骤**
   ```bash
   node clean-icons.js
   node generate-font.js
   ```

4. **查看详细输出**
   ```bash
   DEBUG=* ./bin/build-icons.sh
   ```

## 🔨 开发说明

### 修改SVG清理规则

编辑 `clean-icons.js` 中的 `svgoConfig` 对象：

```javascript
const svgoConfig = {
  plugins: [
    // 添加或修改插件配置
    {
      name: 'your-plugin',
      params: {
        // 插件参数
      }
    }
  ]
};
```

### 自定义字体生成参数

编辑 `generate-font.js` 中的 webfont 配置：

```javascript
const result = await webfont({
  // 修改配置参数
  fontHeight: 2048,    // 改变字体高度
  formats: ['ttf', 'woff2'],  // 添加更多格式
  // ... 其他参数
});
```

### 扩展输出格式

可以修改 `generate-font.js` 以支持更多输出格式：
- WOFF/WOFF2: 网页字体格式
- EOT: IE兼容格式
- SVG: SVG字体格式

### 添加CSS生成

可以在 `generate-font.js` 中添加CSS文件生成逻辑：

```javascript
// 生成CSS规则
const cssRules = Object.entries(iconMapping).map(([name, data]) => 
  `.icon-${name}:before { content: "${data.hex}"; }`
);

const cssContent = `
@font-face {
  font-family: 'iconfont';
  src: url('icons.ttf') format('truetype');
}

${cssRules.join('\n')}
`;

fs.writeFileSync(path.join(outputDir, 'icons.css'), cssContent);
```

## 📄 许可证

ISC License

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

**版本**: 1.0.0 