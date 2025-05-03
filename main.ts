/**
 * 从GitHub和jsDelivr代理package.json请求
 */
import { serve } from "https://deno.land/std/http/server.ts"

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/{owner}/{repo}/{branch}/package.json'
const JSDELIVR_URL = 'https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/package.json'

/**
 * 代理请求到GitHub或jsDelivr
 * @param owner - 仓库所有者
 * @param repo - 仓库名称
 * @param branch - 分支名称，默认为HEAD
 * @returns 请求响应
 */
async function proxyRequest (owner: string, repo: string, branch: string | null) {
  const githubUrl = GITHUB_RAW_URL
    .replace('{owner}', owner)
    .replace('{repo}', repo)
    .replace('{branch}', branch || 'HEAD')

  const jsDelivrUrl = JSDELIVR_URL
    .replace('{owner}', owner)
    .replace('{repo}', repo)
    .replace('{branch}', branch || 'HEAD')

  try {
    const response = await fetch(githubUrl)
    if (!response.ok) {
      throw new Error('GitHub请求失败，尝试从jsDelivr获取...')
    }
    return response
  } catch (error) {
    console.log((error as Error).message)
    const jsDelivrResponse = await fetch(jsDelivrUrl)
    if (!jsDelivrResponse.ok) {
      throw new Error('从jsDelivr获取也失败了')
    }
    return jsDelivrResponse
  }
}

/**
 * 启动HTTP服务器处理请求
 */
serve(async (req) => {
  const url = new URL(req.url)
  const searchParams = url.searchParams

  const owner = searchParams.get('owner')
  const repo = searchParams.get('repo')
  const branch = searchParams.get('branch')

  if (!owner || !repo) {
    return new Response(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deno Package Proxy</title>
  <style>
    body {
      font-family: 'Comic Sans MS', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
      color: #333;
      background-color: #f9f9f9;
    }
    h1 {
      color: #6200ee;
      text-align: center;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    code {
      background: #f0f0f0;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.9rem;
    }
    .example {
      margin: 1.5rem 0;
      padding: 1rem;
      background: #f5f0ff;
      border-left: 4px solid #6200ee;
      border-radius: 4px;
    }
    .copy-container {
      position: relative;
      background: #f0f0f0;
      border-radius: 4px;
      padding: 0.5rem;
      margin: 1rem 0;
    }
    .copy-text {
      font-family: monospace;
      padding-right: 40px;
      word-break: break-all;
    }
    .copy-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: #6200ee;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .copy-btn:hover {
      background: #4b00b5;
    }
    .mascot {
      text-align: center;
      font-size: 2rem;
      margin: 1rem 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>✨ Deno Package Proxy ✨</h1>
    
    <div class="mascot">(づ ◕‿◕ )づ</div>
    
    <p>哎呀～看起来你没有提供参数呢！这个可爱的小代理服务需要知道你想查找哪个包才能帮助你哦～</p>
    
    <p>要使用这个服务，你需要提供这些参数：</p>
    <ul>
      <li><code>owner</code> - GitHub仓库的所有者（必须）</li>
      <li><code>repo</code> - 仓库名称（必须）</li>
      <li><code>branch</code> - 分支名称（可选，默认为'HEAD'）</li>
    </ul>
    
    <div class="example">
      <p>比如，试试这个链接吧：</p>
      <div class="copy-container">
        <div class="copy-text">https://pkg-proxy.deno.dev/?owner=github&repo=docs&branch=HEAD</div>
        <button class="copy-btn" onclick="copyToClipboard()">复制</button>
      </div>
    </div>
    
    <p>这个小代理会先尝试从GitHub获取package.json，如果失败了，它会转向jsDelivr继续尝试～</p>
    
    <div class="mascot">(●'◡'●)</div>
    
    <p style="text-align: center; margin-top: 2rem; font-size: 0.8rem;">
      用❤️和Deno制作 · 由 Deno Deploy 提供支持
    </p>
  </div>
  
  <script>
    function copyToClipboard() {
      const text = document.querySelector('.copy-text').innerText;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.copy-btn');
        const originalText = btn.innerText;
        btn.innerText = '已复制！';
        setTimeout(() => {
          btn.innerText = originalText;
        }, 2000);
      }).catch(err => {
        console.error('复制失败：', err);
        alert('复制失败，请手动复制');
      });
    }
  </script>
</body>
</html>
    `, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })
  }

  try {
    const response = await proxyRequest(owner, repo, branch)
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    })
  } catch (error) {
    return new Response(`错误: ${(error as Error).message}`, { status: 500 })
  }
})

console.log('服务器已启动...')
