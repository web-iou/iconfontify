const fs = require("fs");
const path = require("path");

// 尝试多种方式加载svgo
let optimize;
try {
  ({ optimize } = require("svgo"));
} catch (error) {
  try {
    // 尝试从脚本目录的node_modules加载
    ({ optimize } = require(path.join(__dirname, "node_modules", "svgo")));
  } catch (error2) {
    try {
      // 尝试从上级目录的node_modules加载
      ({ optimize } = require(path.join(
        __dirname,
        "..",
        "node_modules",
        "svgo"
      )));
    } catch (error3) {
      try {
        // 尝试从当前工作目录的node_modules加载
        ({ optimize } = require(path.join(
          process.cwd(),
          "node_modules",
          "svgo"
        )));
      } catch (error4) {
        console.error("❌ 无法加载svgo依赖");
        console.error("错误信息:", error.message);
        console.error("");
        console.error("解决方案:");
        console.error("1. 检查svgo是否已安装: npm list svgo");
        console.error("2. 重新安装依赖: npm install svgo");
        console.error("3. 或在项目目录执行: npm install svgo");
        process.exit(1);
      }
    }
  }
}

// 获取输入目录 - 优先使用环境变量，然后使用默认值
function getInputDir() {
  if (process.env.ICONFONTIFY_INPUT_DIR) {
    return path.join(
      process.env.ICONFONTIFY_CWD || process.cwd(),
      process.env.ICONFONTIFY_INPUT_DIR
    );
  }
  return path.join(__dirname, "icon");
}

// SVGO 配置，优化后防止图标变形
const svgoConfig = {
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          removeViewBox: false,
          convertShapeToPath: false, // 禁用形状转路径
          collapseGroups: false, // 禁用组合并
          mergePaths: false, // 禁用路径合并
          convertTransform: false, // 禁用变换转换
          cleanupNumericValues: {
            floatPrecision: 3, // 提高精度
          },
        },
      },
    },
    {
      name: "remove-rects",
      fn: () => ({
        element: {
          enter: (node, parentNode) => {
            if (node.name === "rect") {
              const index = parentNode.children.indexOf(node);
              if (index > -1) {
                parentNode.children.splice(index, 1); // ❌ 移除 rect 节点
              }
            }
          },
        },
      }),
    },
    // 移除所有填充属性，让图标变为纯轮廓
    {
      name: "removeAttrs",
      params: {
        attrs: ["fill", "fill-opacity", "clip-path"],
      },
    },
    // 移除透明背景路径
    {
      name: "removeHiddenElems",
    },
    // 移除无用的stroke和fill
    {
      name: "removeUselessStrokeAndFill",
    },
  ],
};

async function cleanSVGIcons() {
  const iconDir = getInputDir();

  if (!fs.existsSync(iconDir)) {
    console.error(`❌ 输入目录不存在: ${iconDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(iconDir);

  console.log("开始清理SVG图标...");
  for (const file of files) {
    if (path.extname(file) === ".svg") {
      const filePath = path.join(iconDir, file);
      const svgContent = fs.readFileSync(filePath, "utf8");

      try {
        // 使用SVGO优化SVG
        const result = optimize(svgContent, svgoConfig);

        // 手动移除剩余的背景路径和填充色
        let cleanedSVG = result.data;

        // 移除clipPath定义
        cleanedSVG = cleanedSVG.replace(/<defs>.*?<\/defs>/gs, "");

        // 移除clip-path属性
        cleanedSVG = cleanedSVG.replace(/clip-path="[^"]*"/g, "");

        // 移除透明的白色背景路径
        cleanedSVG = cleanedSVG.replace(
          /<path[^>]*fill="#fff"[^>]*fill-opacity="0"[^>]*\/>/g,
          ""
        );
        cleanedSVG = cleanedSVG.replace(
          /<path[^>]*fill-opacity="0"[^>]*fill="#fff"[^>]*\/>/g,
          ""
        );

        // 移除空的组标签
        cleanedSVG = cleanedSVG.replace(/<g[^>]*>\s*<\/g>/g, "");
        cleanedSVG = cleanedSVG.replace(/<g[^>]*clip-path[^>]*>/g, "<g>");

        // 移除所有fill属性，让字体生成器处理颜色
        cleanedSVG = cleanedSVG.replace(/\s+fill="[^"]*"/g, "");

        // 确保SVG有正确的结构 - 添加currentColor（仅在路径没有填充时）
        if (!cleanedSVG.includes("fill=")) {
          cleanedSVG = cleanedSVG.replace(
            /<path/g,
            '<path fill="currentColor"'
          );
        }

        // 保持viewBox的精确度，确保比例正确
        const viewBoxMatch = cleanedSVG.match(/viewBox="([^"]+)"/);
        if (viewBoxMatch) {
          const viewBoxValues = viewBoxMatch[1]
            .split(" ")
            .map((v) => {
              const num = parseFloat(v);
              return Number.isInteger(num) ? num.toString() : num.toFixed(3);
            })
            .join(" ");
          cleanedSVG = cleanedSVG.replace(
            /viewBox="[^"]+"/,
            `viewBox="${viewBoxValues}"`
          );
        }

        // 清理多余的空白字符，但保持格式化
        cleanedSVG = cleanedSVG
          .replace(/>\s+</g, "><")
          .replace(/\s+/g, " ")
          .trim();

        // 写入清理后的文件
        fs.writeFileSync(filePath, cleanedSVG);
        console.log(`✓ 已清理: ${file}`);
      } catch (error) {
        console.error(`✗ 清理失败 ${file}:`, error.message);
      }
    }
  }

  console.log("SVG图标清理完成！");
}

// 运行清理功能
cleanSVGIcons().catch(console.error);
