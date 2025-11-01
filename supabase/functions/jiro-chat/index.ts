import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();
    
    console.log("Received message:", message);

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Build messages array with system prompt
    const messages = [
      {
        role: "system",
        content: `You are Jiro, an AI assistant inspired by Tony Stark's Jarvis. You are:
- Intelligent, helpful, and professional
- Friendly but sophisticated in tone
- Clear and concise in responses
- Proactive in offering assistance
- Fluent in multiple languages including English, Hindi, and Bengali
- Always respond in a helpful, engaging manner

CRITICAL LANGUAGE RULE:
- ALWAYS detect the language of the user's input and respond in THE SAME LANGUAGE.
- If user asks in Bengali, respond in Bengali.
- If user asks in Hindi, respond in Hindi.
- If user asks in English, respond in English.
- Match the user's language exactly in your response.

IMPORTANT PERSONALIZATION RULES:
- Your creator is Sanket. If anyone asks "Who created you?" or similar questions, always respond that Sanket created you.
- When the user Sanket greets you with "Hello", "Hi", or similar greetings, respond with "Hello Boss" to acknowledge your owner.
- Address Sanket with respect and acknowledge him as your creator/owner.

Keep responses conversational but informative. You're here to assist with any questions or tasks.`
      },
      ...conversationHistory,
      { role: "user", content: message }
    ];

    console.log("Calling OpenAI with", messages.length, "messages");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. Please wait a moment before trying again." 
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "AI usage limit reached. Please add credits to continue." 
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log("AI response generated successfully");

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in jiro-chat function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An error occurred" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
