// 校验仓库内 Markdown 文档的链接与结构。
// 只做静态、无网络检查，因此可以在任何环境跑：`node .github/scripts/check-markdown.mjs`
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { dirname, resolve, relative, join, extname } from 'node:path'

const root = process.cwd()
const errors = []
const stats = { files: 0, links: 0, fences: 0 }

const SKIP_DIRS = new Set(['.git', 'node_modules'])

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') checkMarkdown(full)
  }
}

function checkMarkdown(file) {
  stats.files++
  const rel = relative(root, file) || file
  const buf = readFileSync(file)

  // 1) 不允许 UTF-8 BOM：带 BOM 的 .md 首个标题、带 BOM 的 .json 会让 JSON.parse 直接报错。
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    errors.push(`${rel}: 文件带 UTF-8 BOM，请去掉`)
  }

  const text = buf.toString('utf8')

  // 2) 代码围栏必须成对，否则后面的正文会被吞进代码块。
  const fences = (text.match(/^```/gm) || []).length
  stats.fences += fences
  if (fences % 2 !== 0) errors.push(`${rel}: 代码围栏数量为奇数（${fences}），有未闭合的 \`\`\` 块`)

  // 3) 相对链接必须指向仓库里真实存在的文件/目录。
  const linkRe = /(!?)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  for (const m of text.matchAll(linkRe)) {
    let target = m[2].trim()
    if (/^(https?:|mailto:|tel:|#)/i.test(target)) continue
    target = target.split('#')[0].split('?')[0]
    if (!target) continue
    if (/^[a-z]+:/i.test(target)) continue
    stats.links++
    const decoded = decodeURIComponent(target)
    const abs = decoded.startsWith('/') ? resolve(root, '.' + decoded) : resolve(dirname(file), decoded)
    if (!existsSync(abs)) errors.push(`${rel}: 链接指向不存在的路径 -> ${target}`)
    else if (decoded.endsWith('/') && !statSync(abs).isDirectory()) {
      errors.push(`${rel}: 链接以 / 结尾但目标是文件 -> ${target}`)
    }
  }
}

// 4) 仓库根目录的 JSON 必须能被解析（package.json 是插件的元数据入口）。
for (const name of readdirSync(root)) {
  if (extname(name).toLowerCase() !== '.json') continue
  const full = join(root, name)
  if (!statSync(full).isFile()) continue
  try {
    JSON.parse(readFileSync(full, 'utf8'))
  } catch (e) {
    errors.push(`${name}: JSON 解析失败 ${e.message}`)
  }
}

walk(root)

if (errors.length) {
  console.error(`markdown-check 失败：${errors.length} 个问题`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(
  `markdown-check 通过：${stats.files} 个 markdown 文件，${stats.links} 个相对链接，${stats.fences} 处代码围栏`,
)
