import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "u781187371_tp_dumpsters",
  password: "Cantaritos1.",
  database: "u781187371_tp_dumpsters",
};

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, language, history } = await request.json();

    if (!message || !sessionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    // Save user message to database
    await connection.execute(
      `INSERT INTO chat_messages (session_id, role, content, language, created_at) VALUES (?, ?, ?, ?, NOW())`,
      [sessionId, "user", message, language || "en"]
    );

    // Call OpenClaw agent (this would be YOU responding)
    const agentResponse = await callOpenClawAgent(message, sessionId, language, history);

    // Save assistant response to database
    await connection.execute(
      `INSERT INTO chat_messages (session_id, role, content, language, created_at) VALUES (?, ?, ?, ?, NOW())`,
      [sessionId, "assistant", agentResponse, language || "en"]
    );

    await connection.end();

    return NextResponse.json({ reply: agentResponse });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function callOpenClawAgent(
  message: string,
  sessionId: string,
  language: string,
  history: any[]
): Promise<string> {
  // TODO: Replace this with actual OpenClaw agent webhook/API call
  // For now, return intelligent demo responses based on keywords

  const msg = message.toLowerCase();

  // Pricing questions
  if (msg.includes("price") || msg.includes("cost") || msg.includes("precio") || msg.includes("costo")) {
    if (language === "es") {
      return `💰 **Precios de TP Dumpsters:**

🟢 **General Debris** (construcción, demolición)
• 10 yard: $600 (7 días, 1 ton incluida)
• 20 yard: $650 (7 días, 2 tons incluidas)
• 30 yard: $700 (7 días, 3 tons incluidas)

🟤 **Materiales Pesados** (10 yard, 3 días)
• Clean Soil: $600 (sin límite de peso)
• Clean Concrete: $600 (95% puro, sin varilla)
• Mixed Materials: $750 (mezcla tierra/concreto)

📌 **Extras:**
• Días extra: $49/día
• Sobrepeso: $125/ton prorrateado

🎉 **¡Reserva en línea y obtén 5% de descuento!**

[Reserva aquí](https://tpdumpsters.com/booking) o llámanos: **(510) 650-0080**`;
    } else {
      return `💰 **TP Dumpsters Pricing:**

🟢 **General Debris** (construction, demolition)
• 10 yard: $600 (7 days, 1 ton included)
• 20 yard: $650 (7 days, 2 tons included)
• 30 yard: $700 (7 days, 3 tons included)

🟤 **Heavy Materials** (10 yard, 3 days)
• Clean Soil: $600 (no weight limit)
• Clean Concrete: $600 (95% pure, no rebar)
• Mixed Materials: $750 (soil & concrete mix)

📌 **Extras:**
• Extra days: $49/day
• Overweight: $125/ton prorated

🎉 **Book online and get 5% off!**

[Book here](https://tpdumpsters.com/booking) or call us: **(510) 650-0080**`;
    }
  }

  // Size/which dumpster questions
  if (msg.includes("size") || msg.includes("which") || msg.includes("tamaño") || msg.includes("cuál") || msg.includes("necesito")) {
    if (language === "es") {
      return `🤔 **¿Qué tamaño de dumpster necesitas?**

Te ayudo a elegir:

**10 Yard** (pequeño) — Ideal para:
• Limpieza de garaje o sótano
• Renovación de baño
• Tierra o concreto (proyectos pequeños)

**20 Yard** (mediano) — Ideal para:
• Renovación de cocina
• Proyectos de techo
• Limpieza de casa completa
• ⭐ **Más popular para contratistas**

**30 Yard** (grande) — Ideal para:
• Demolición completa
• Nueva construcción
• Proyectos comerciales grandes

💡 **¿Aún no estás seguro?** Llámanos al **(510) 650-0080** y te ayudamos a elegir el tamaño perfecto para tu proyecto.

O [reserva en línea](https://tpdumpsters.com/booking) con 5% de descuento.`;
    } else {
      return `🤔 **Which dumpster size do you need?**

Let me help you choose:

**10 Yard** (small) — Best for:
• Garage or basement cleanout
• Bathroom renovation
• Soil or concrete (small projects)

**20 Yard** (medium) — Best for:
• Kitchen remodel
• Roofing projects
• Whole-house cleanout
• ⭐ **Most popular for contractors**

**30 Yard** (large) — Best for:
• Full demolition
• New construction
• Large commercial projects

💡 **Still not sure?** Call us at **(510) 650-0080** and we'll help you pick the perfect size for your project.

Or [book online](https://tpdumpsters.com/booking) and get 5% off.`;
    }
  }

  // Service/how it works questions
  if (msg.includes("service") || msg.includes("work") || msg.includes("servicio") || msg.includes("funciona")) {
    if (language === "es") {
      return `📅 **¿Cómo funciona nuestro servicio?**

Es súper fácil:

1️⃣ **Reserva** en línea o por teléfono
2️⃣ **Entrega** — Te lo llevamos el día que elijas
3️⃣ **Llena** el dumpster (7 días incluidos)
4️⃣ **Recogida** — Llámanos cuando esté listo

✅ **Incluido:**
• Entrega y recogida
• 7 días de renta (General Debris)
• 3 días (materiales pesados)
• Peso incluido según tamaño

💰 **Precio único** — Sin cargos ocultos
📞 **Entrega el mismo día** disponible (llama antes del mediodía)
🎉 **5% descuento** al reservar en línea

[Reserva ahora](https://tpdumpsters.com/booking) o llama: **(510) 650-0080**`;
    } else {
      return `📅 **How our service works:**

It's super easy:

1️⃣ **Book** online or by phone
2️⃣ **Delivery** — We drop it off on your chosen day
3️⃣ **Fill it** up (7 days included)
4️⃣ **Pickup** — Call us when you're ready

✅ **Included:**
• Delivery and pickup
• 7-day rental (General Debris)
• 3 days (heavy materials)
• Weight allowance based on size

💰 **Flat-rate pricing** — No hidden fees
📞 **Same-day delivery** available (call before noon)
🎉 **5% discount** when you book online

[Book now](https://tpdumpsters.com/booking) or call: **(510) 650-0080**`;
    }
  }

  // Service areas
  if (msg.includes("area") || msg.includes("city") || msg.includes("location") || msg.includes("zona") || msg.includes("ciudad")) {
    if (language === "es") {
      return `📍 **Áreas de Servicio — Bay Area, California**

Servimos toda el Área de la Bahía, incluyendo:

**Alameda County:**
Oakland, Berkeley, Fremont, Hayward, Alameda, San Leandro, Livermore, Pleasanton, Dublin, Castro Valley

**Contra Costa County:**
Concord, Walnut Creek, Richmond, Antioch, Pittsburg, San Ramon, Martinez, Pinole, Brentwood

**San Mateo County, Santa Clara County, Solano County** y más.

¿No ves tu ciudad? Llámanos al **(510) 650-0080** — ¡probablemente también te servimos!`;
    } else {
      return `📍 **Service Areas — Bay Area, California**

We serve the entire Bay Area, including:

**Alameda County:**
Oakland, Berkeley, Fremont, Hayward, Alameda, San Leandro, Livermore, Pleasanton, Dublin, Castro Valley

**Contra Costa County:**
Concord, Walnut Creek, Richmond, Antioch, Pittsburg, San Ramon, Martinez, Pinole, Brentwood

**San Mateo County, Santa Clara County, Solano County** and more.

Don't see your city? Call us at **(510) 650-0080** — we probably serve you too!`;
    }
  }

  // Default response
  if (language === "es") {
    return `Gracias por tu pregunta. Para una respuesta más específica, llámanos al **(510) 650-0080** o [reserva en línea](https://tpdumpsters.com/booking) y te ayudamos en tiempo real. 🧱

También puedes preguntarme sobre:
• Precios y tamaños
• Cómo funciona el servicio
• Áreas que servimos`;
  } else {
    return `Thanks for your question! For a more specific answer, call us at **(510) 650-0080** or [book online](https://tpdumpsters.com/booking) and we'll help you in real-time. 🧱

You can also ask me about:
• Pricing and sizes
• How our service works
• Service areas`;
  }
}
