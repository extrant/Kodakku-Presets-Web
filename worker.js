const REPO_SOURCES = [
  "https://raw.githubusercontent.com/Karlin-Z/KodakkuAssistScript/main/OnlineRepo.json",
  "https://raw.githubusercontent.com/cyf5119/KAScripts/main/OnlineRepo.json",
  "https://raw.githubusercontent.com/Sonnet46/KodakkuScript/main/OnlineRepo.json",
  "https://raw.githubusercontent.com/VeeverSW/Kodakku-Script/main/OnlineRepo.json",
  "https://raw.githubusercontent.com/lianying1997/UsamisKodakku/main/OnlineRepo.json",
  "https://raw.githubusercontent.com/JiaXX7799/KodakkuAssist/refs/heads/master/OnlineRepo.json",
  "https://raw.githubusercontent.com/DueDine/KDrawScript/main/Repo.json",
  "https://raw.githubusercontent.com/AdmiralLvtzov/CicerosKodakkuAssist/main/OnlineRepo.json",
  "https://raw.githubusercontent.com/Hibiya615/TetoraKAScript/main/OnlineRepo.json",
  "https://raw.githubusercontent.com/a16239438/RyougiMio_KodakkuScripts/refs/heads/main/OnlineRepo.json",
  "https://raw.githubusercontent.com/Codaaaaaa/KodakkuScripts/main/OnlineRepo.json",
  "https://raw.githubusercontent.com/Lunar-Nya/KAScript/main/OnlineRepo.json",
  "https://raw.githubusercontent.com/Errerer/KodakkuAssistScript/main/OnlineRepo.json",
  "https://raw.githubusercontent.com/ShoOtaku/KodakkuAssist/refs/heads/main/OnlineRepo.json",
  "https://raw.githubusercontent.com/keaidell-cyber/MyFF14Scripts/refs/heads/main/OnlineRepo.json",
  "https://raw.githubusercontent.com/Haruna08t9/KodakkuScript/master/OnlineRepo.json",
  "https://raw.githubusercontent.com/tsingsooAlpha/KodakkuAssistScripts/main/OnlineRepo.json",
  "https://raw.githubusercontent.com/kanyeishere/kodakku-script/refs/heads/master/ScriptMaster.json",
  "https://raw.githubusercontent.com/Baelixac/KodakkuFFXIV/refs/heads/master/OnlineRepo.json",
  "https://raw.githubusercontent.com/lr0452/KodakkuAssistScript/refs/heads/master/OnlineRepo.json",
  "https://raw.githubusercontent.com/Meedvast/KDA-Script/refs/heads/main/OnlineRepo.json",
  "https://raw.githubusercontent.com/KurotsukiRuri/Drawing/refs/heads/main/OnlineRepo.json",

];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cache = caches.default;
    
    // 1. 尝试从边缘缓存中读取现有的结果
    let cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      const responses = await Promise.all(
        REPO_SOURCES.map((url, index) => 
          fetch(url, { 
            headers: { 'User-Agent': 'Kodakku-Bot' },
            // 2. 对每个 GitHub 源请求也开启 10 分钟缓存，双重保险
            cf: { cacheTtl: 600, cacheEverything: true } 
          })
            .then(r => r.ok ? r.json() : [])
            .then(list => list.map(item => ({
              n: item.Name,         // Name
              v: item.Version,      // Version
              a: item.Author,       // Author
              t: item.TerritoryIds, // TerritoryIds
              u: item.UpdateInfo,   // UpdateInfo
              o: item.Note,         // Note
              d: item.DownloadUrl,  // DownloadUrl
              i: index              // 来源索引
            })))
            .catch(() => [])
        )
      );

      const result = { s: REPO_SOURCES, p: responses.flat() };

      // 3. 构建响应并设置缓存头
      const response = new Response(JSON.stringify(result), {
        headers: { 
          "Content-Type": "application/json;charset=UTF-8",
          // s-maxage=600 告诉 Cloudflare 边缘节点缓存 600 秒
          // max-age=600 告诉用户的浏览器缓存 600 秒
          "Cache-Control": "public, s-maxage=600, max-age=600",
          ...corsHeaders 
        }
      });

      // 4. 将响应存入缓存（使用 ctx.waitUntil 避免阻塞当前返回）
      ctx.waitUntil(cache.put(request, response.clone()));

      return response;
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }
};