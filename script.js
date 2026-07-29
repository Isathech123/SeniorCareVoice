const boton = document.getElementById("microfono");
const texto = document.getElementById("texto");

// Comprobar si el navegador tiene reconocimiento de voz
const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {

    texto.innerHTML =
        "Este navegador no permite reconocimiento de voz.";

    boton.disabled = true;

} else {

    const reconocimiento = new SpeechRecognition();

    reconocimiento.lang = "es-ES";
    reconocimiento.continuous = false;
    reconocimiento.interimResults = false;

    boton.onclick = function () {

        texto.innerHTML = "🎤 Escuchando...";

        try {
            reconocimiento.start();
        } catch (error) {
            console.error("Error al iniciar reconocimiento:", error);
            texto.innerHTML = "No se pudo iniciar el micrófono.";
        }

    };

reconocimiento.onresult = async function (event) {

    const resultado =
        event.results[0][0].transcript;

    console.log("Texto reconocido:", resultado);

    texto.innerHTML = resultado;

    try {

        const respuesta = await fetch("/analizar", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                texto: resultado
            })

        });

        const datos = await respuesta.json();

        console.log("Respuesta de Gemini:", datos);

    } catch (error) {

        console.error("Error al enviar la cita:", error);

    }

};

    reconocimiento.onerror = function (event) {

        console.error("Error de reconocimiento:", event.error);

        texto.innerHTML =
            "Error del micrófono: " + event.error;

    };

    reconocimiento.onend = function () {

        console.log("Reconocimiento terminado");

    };
}