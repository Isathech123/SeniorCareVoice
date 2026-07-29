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

    reconocimiento.onresult = function (event) {

        const resultado =
            event.results[0][0].transcript;

        console.log("Texto reconocido:", resultado);

        texto.innerHTML = resultado;

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