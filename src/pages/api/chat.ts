import type { APIRoute } from "astro";

let conversationHistory: { role: "user" | "model", text: string }[] = [];

const temasPermitidos = [
  "Canva", "Kahoot", "Google Classroom", "Edmodo", "Moodle", "Quizizz",
  "Microsoft Teams", "Zoom", "Prezi", "Socrative", "Nearpod", "ClassDojo",
  "Flipgrid", "Padlet", "Herramientas digitales para la educación",
  "Aprendizaje en línea", "Educación a distancia", "Gamificación en el aula"
];

export const POST: APIRoute = async ({ request }) => {
  const { message } = await request.json();
  const apiKey = import.meta.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key no configurada" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const mensajeLimpio = message.toLowerCase().trim();

  const saludos = ["hola", "buenas", "qué tal", "hey", "saludos", "holi"];
  if (saludos.some(saludo => mensajeLimpio.startsWith(saludo))) {
    return new Response(
      JSON.stringify({
        reply: "¡Hola! Soy tu asistente educativo. Puedes preguntarme sobre herramientas digitales como Canva, Kahoot, Zoom, Moodle, entre otras. ¿En qué te puedo ayudar hoy? 😊",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  conversationHistory.push({ role: "user", text: message });

  try {
    const instrucciones = `Eres un asistente educativo amable y claro. Siempre debes responder en español, sin importar el idioma en el que el usuario pregunte. 
Tu objetivo es ayudar a los usuarios a entender y usar herramientas digitales educativas como: ${temasPermitidos.join(", ")}. 
Evita tecnicismos y responde de forma sencilla. Mantén el contexto de la conversación para que no sea necesario repetir la herramienta cada vez.
Formatea las respuestas sin asteriscos, guiones ni símbolos innecesarios. Responde con texto claro, entendible y fácil de leer.`;

    const contents = [
      {
        role: "user",
        parts: [{ text: instrucciones }]
      },
      ...conversationHistory.map(item => ({
        role: item.role,
        parts: [{ text: item.text }]
      }))
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 500,
            stopSequences: [],
          },
        }),
      }
    );

    const data = await response.json();

    let respuesta = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no entendí la pregunta. ¿Podrías reformularla?";

    // 🔠 Limpieza del texto (remover símbolos de markdown y formatear)
    respuesta = respuesta
      .replace(/\*\*/g, "") // negritas
      .replace(/\*/g, "")   // asteriscos simples
      .replace(/^- /gm, "") // guiones como lista
      .replace(/\n{2,}/g, "\n\n") // evitar demasiados saltos

    conversationHistory.push({ role: "model", text: respuesta });

    return new Response(JSON.stringify({ reply: respuesta }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ reply: "Ocurrió un error al generar la respuesta." }), {
      headers: { "Content-Type": "application/json" },
    });
  }
};
