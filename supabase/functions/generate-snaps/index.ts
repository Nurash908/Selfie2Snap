import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { portrait1, portrait2, frameStyle, frameIndex, totalFrames } = await req.json();

    if (!portrait1 || !portrait2) {
      return new Response(
        JSON.stringify({ error: 'Both portraits are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const styleDescriptions: Record<string, string> = {
      romantic: "soft lighting, warm tones, intimate setting, dreamy atmosphere with bokeh effects",
      cinematic: "dramatic lighting, film-like quality, professional movie scene aesthetic",
      anime: "Japanese anime art style, vibrant colors, expressive features, manga-like",
      vintage: "retro film grain, faded colors, nostalgic 70s/80s photography style",
      fantasy: "magical ethereal lighting, mystical atmosphere, enchanted fairy-tale setting",
      watercolor: "soft watercolor painting style, flowing colors, artistic brush strokes",
      popart: "bold pop art style, vibrant contrasting colors, comic book aesthetic like Andy Warhol",
      cyberpunk: "neon lights, futuristic cyberpunk aesthetic, glowing effects, sci-fi atmosphere"
    };

    const styleDesc = styleDescriptions[frameStyle] || styleDescriptions.romantic;

    const prompt = `Create a stunning portrait photo combining these two people together in a beautiful, natural pose. Style: ${styleDesc}. Frame ${frameIndex + 1} of ${totalFrames}. Make it look professional, high-quality, and emotionally engaging. The two people should appear naturally together as if in a real photoshoot.`;

    console.log(`Generating frame ${frameIndex + 1}/${totalFrames} with style: ${frameStyle}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: portrait1 } },
              { type: "image_url", image_url: { url: portrait2 } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error('No image in response:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'No image generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully generated frame ${frameIndex + 1}`);

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-snaps:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
