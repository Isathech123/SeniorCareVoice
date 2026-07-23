const express = require("express");
const cors = require("cors");
require("dotenv").config();
console.log("Carpeta actual:", process.cwd());
console.log("API KEY CARGADA:", process.env.GEMINI_API_KEY ? "SI" : "NO");
const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    vertexai: false
});

app.get("/", (req, res) => {
    res.send("Servidor SeniorCare funcionando");
});

app.post("/analizar", async (req, res) => {

    try {

        const texto = req.body.texto;

        const respuesta = await ai.models.generateContent({

           model: "gemini-3.5-flash-lite",
            contents: `
Analiza esta frase de una cita médica:

"${texto}"

Devuelve ÚNICAMENTE un JSON válido con exactamente estas tres propiedades:

{
  "fecha": "YYYY-MM-DD",
  "hora": "HH:MM",
  "tipo": "tipo de cita"
}

No escribas explicaciones.
No escribas Markdown.
No escribas texto antes ni después del JSON.
`
        });

const resultado = respuesta.text;

console.log("Respuesta de Gemini:");
console.log(resultado);

const textoLimpio = resultado
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

const datos = JSON.parse(textoLimpio);

res.json(datos);
    } catch (error) {

    console.error(error);

    res.status(500).json({
        error: "Error al analizar la cita",
        detalles: error.message
    });

}

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor funcionando en el puerto ${PORT}`);
});