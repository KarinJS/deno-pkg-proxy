import { serve } from "https://deno.land/std/http/server.ts"

const GITHUB_RAW_URL = "https://raw.githubusercontent.com/{owner}/{repo}/{branch}/package.json"
const JSDELIVR_URL = "https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/package.json"

async function proxyRequest (owner: string, repo: string, branch: string | null) {
  const githubUrl = GITHUB_RAW_URL
    .replace("{owner}", owner)
    .replace("{repo}", repo)
    .replace("{branch}", branch || "HEAD")

  const jsDelivrUrl = JSDELIVR_URL
    .replace("{owner}", owner)
    .replace("{repo}", repo)
    .replace("{branch}", branch || "HEAD")

  try {
    const response = await fetch(githubUrl)
    if (!response.ok) {
      throw new Error(`GitHub request failed, trying jsDelivr...`)
    }
    return response
  } catch (error) {
    console.log((error as Error).message)
    const jsDelivrResponse = await fetch(jsDelivrUrl)
    if (!jsDelivrResponse.ok) {
      throw new Error(`Failed to fetch from jsDelivr as well`)
    }
    return jsDelivrResponse
  }
}

serve(async (req) => {
  const url = new URL(req.url)
  const searchParams = url.searchParams

  const owner = searchParams.get("owner")
  const repo = searchParams.get("repo")
  const branch = searchParams.get("branch")

  if (!owner || !repo) {
    return new Response(
      "Missing required query parameters: owner, repo, branch\n" +
      "Example: https://deno-pkg-proxy.deno.dev/?owner=github&repo=docs&branch=HEAD",
      { status: 400 }
    )
  }

  try {
    const response = await proxyRequest(owner, repo, branch)
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    })
  } catch (error) {
    return new Response(`Error: ${(error as Error).message}`, { status: 500 })
  }
})

console.log("Server running...")
