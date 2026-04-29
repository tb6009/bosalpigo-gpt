// Cloudflare Worker — Anthropic API 프록시
// 배포: Cloudflare Workers → Create → Edit code에 붙여넣고 Deploy
//
// 두 가지 모드:
//   A) BYOK 모드 (기본): 사용자가 브라우저에 키 넣음. Worker는 그대로 전달.
//   B) 숨김 키 모드: Worker Secret에 ANTHROPIC_API_KEY 저장. 사용자 키 입력 불필요.
//                    (공개 배포용. 사용량 제한 꼭 걸 것)

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const url = new URL(request.url);
    if (url.pathname !== "/v1/messages") {
      return json({ error: "Not found" }, 404);
    }

    // API 키: 사용자 헤더에서 가져오거나(BYOK), Worker Secret에서 가져옴
    const userKey = request.headers.get("x-api-key");
    const apiKey = userKey || env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return json({ error: "API key missing" }, 401);
    }

    const body = await request.text();

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body,
    });

    const respBody = await anthropicRes.text();
    return new Response(respBody, {
      status: anthropicRes.status,
      headers: {
        "content-type": "application/json",
        ...corsHeaders(),
      },
    });
  },
};

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access",
    "access-control-max-age": "86400",
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() },
  });
}
