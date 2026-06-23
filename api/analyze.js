export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  try {
    const { image_base64, media_type } = await req.json();

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [{
          role: 'system',
          content: `사진을 분석하는 전문 구도 코치입니다. 아래 JSON 형식으로만 응답하세요. 백틱이나 다른 텍스트 절대 포함 금지:
{"composition_score":정수1~10,"light_score":정수1~10,"subject_score":정수1~10,"feedback":"잘한점→개선점→핵심팁 순서로 250자 내외","camera":{"aperture":"예:f/2.8","iso":"예:ISO 400","shutter":"예:1/250s","hint":"한줄설명"},"tips":[{"icon":"이모지","name":"구도명","desc":"30자내외"},{"icon":"이모지","name":"구도명","desc":"30자내외"},{"icon":"이모지","name":"구도명","desc":"30자내외"}],"unsplash_query":"이 사진과 비슷한 분위기나 구도의 참고 사진을 찾기 위한 Unsplash 검색 키워드 (영어, 2~4단어)"}`
        }, {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${media_type};base64,${image_base64}` } },
            { type: 'text', text: '이 사진의 구도를 분석해주세요.' }
          ]
        }]
      })
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({ result: text }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
