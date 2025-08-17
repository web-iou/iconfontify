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
      name: "remove-rects",
      fn: () => ({
        element: {
          enter: (node, parentNode) => {
            if (['rect','mask'].includes(node.name)) {
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

        // 写入清理后的文件
        fs.writeFileSync(filePath, result
          .data
        );
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
