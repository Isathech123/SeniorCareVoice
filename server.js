const express = require("express");
const cors = require("cors");
require("dotenv").config();
console.log("Carpeta actual:", process.cwd());
console.log("API KEY CARGADA:", process.env.GEMINI_API_KEY ? "SI" : "NO");
const { GoogleGenAI } = require("@google/genai");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

let credentials;

if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {

    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

} else {

    const archivoCredenciales = path.join(
        __dirname,
        "credentials",
        "seniorcarevoice-ea1d45aa1f35.json"
    );

    credentials = JSON.parse(
        fs.readFileSync(archivoCredenciales, "utf8")
    );

}

const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({
    version: "v4",
    auth
});
const spreadsheetId = "1-0KEtcPy-CIB3KEUZhdSzn1vLHpb9oDZT5c8b746sjc";
const app = express();
const ONESIGNAL_APP_ID = "584603d6-e697-4d21-9707-ac1bf58f8138";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
async function enviarNotificacion(pushUserId, titulo, mensaje) {

    const respuesta = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Key ${ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,

            include_subscription_ids: [pushUserId],

            target_channel: "push",

            headings: {
                es: titulo
            },

            contents: {
                es: mensaje
            }
        })
    });

    const datos = await respuesta.json();

    console.log("Respuesta de OneSignal:", datos);

    if (!respuesta.ok) {
        throw new Error(JSON.stringify(datos));
    }

    return datos;
}
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    vertexai: false
});

app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
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
app.get("/probar-citas", async (req, res) => {

    try {

        const respuesta = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: "Appointments!A:E"
        });

        res.json(respuesta.data.values || []);

    } catch (error) {

        console.error("Error leyendo Google Sheets:", error);

        res.status(500).json({
            error: "No se pudieron leer las citas"
        });

    }

});
async function revisarRecordatorios() {

    try {

        const respuesta = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: "Appointments!A:F"
        });

        const filas = respuesta.data.values || [];

        if (filas.length <= 1) {
            console.log("No hay citas para revisar.");
            return;
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const hoyNumero =
            hoy.getFullYear() * 10000 +
            (hoy.getMonth() + 1) * 100 +
            hoy.getDate();

        console.log("Fecha de hoy:", hoyNumero);

        for (let i = 1; i < filas.length; i++) {

            const fila = filas[i];

            const usuario = fila[0];
            const hora = fila[1];
            const tipo = fila[2];
            const fecha = fila[3];
            const numeroFecha = Number(fila[4]);
            const pushUserId = fila[5];

            if (!usuario || !tipo || !numeroFecha || !pushUserId) {
                continue;
            }

            const fechaCita = new Date(
                Math.floor(numeroFecha / 10000),
                Math.floor((numeroFecha % 10000) / 100) - 1,
                numeroFecha % 100
            );

            fechaCita.setHours(0, 0, 0, 0);

            const diferenciaMilisegundos =
                fechaCita.getTime() - hoy.getTime();

            const diasRestantes =
                Math.round(
                    diferenciaMilisegundos /
                    (1000 * 60 * 60 * 24)
                );

            if (diasRestantes === 3 || diasRestantes === 1) {

                const titulo = "Recordatorio de cita";

                const mensaje =
                    `Tienes una cita de ${tipo} el ${fecha}` +
                    `${hora ? ` a las ${hora}` : ""}. ` +
                    `Faltan ${diasRestantes} días.`;

                console.log(
                    `Enviando recordatorio a ${usuario}: ${mensaje}`
                );

                try {

                    await enviarNotificacion(
                        pushUserId,
                        titulo,
                        mensaje
                    );

                } catch (error) {

                    console.error(
                        `Error enviando notificación a ${usuario}:`,
                        error.message
                    );

                }
            }
        }

    } catch (error) {

        console.error(
            "Error revisando los recordatorios:",
            error
        );

    }
}

revisarRecordatorios();

setInterval(() => {
    revisarRecordatorios();
}, 24 * 60 * 60 * 1000);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor funcionando en el puerto ${PORT}`);
});