import type { APIRoute } from "astro";

const allowedTopics = [
  "Canva",
  "Kahoot",
  "Google Classroom",
  "Edmodo",
  "Moodle",
  "Quizizz",
  "Microsoft Teams",
  "Zoom",
  "Prezi",
  "Socrative",
  "Nearpod",
  "ClassDojo",
  "Flipgrid",
  "Padlet",
  "Herramientas digitales para educación",
  "Aprendizaje en línea",
  "Educación a distancia",
  "Gamificación en el aula"
];

const greetings = ["hola", "buenas", "qué tal", "hey", "saludos", "holi"];

export const POST: APIRoute = async ({ request }) => {
  const { message } = await request.json();
  const apiKey = import.meta.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key no configurada" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const lowerMessage = message.toLowerCase();

    // Manejo de saludos
    if (greetings.some(greet => lowerMessage.includes(greet))) {
      return new Response(
        JSON.stringify({ reply: "¡Hola! Soy un chatbot educativo. Pregunta sobre herramientas tecnológicas como Kahoot, Canva, Teams y más. 😊" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Peticiones a Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] }),
      }
    );

    const data = await response.json();
    let botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No entiendo la pregunta.";

    // Filtrar respuestas según temas permitidos
    const isRelevant = allowedTopics.some(topic => botReply.includes(topic));

    if (!isRelevant) {
      botReply = "Solo puedo responder sobre herramientas educativas como Canva, Kahoot, Moodle, Teams y más. Pregunta sobre estas tecnologías. 📚✨";
    }

    return new Response(JSON.stringify({ reply: botReply }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ reply: "Error en el servidor" }), {
      headers: { "Content-Type": "application/json" },
    });
  }
};
