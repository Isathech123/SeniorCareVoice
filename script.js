const boton = document.getElementById("microfono");
const texto = document.getElementById("texto");
const resultadoCita =
    document.getElementById("resultadoCita");
const enviarCita =
    document.getElementById("enviarCita");
let datosCita = null;
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
        datosCita = datos;
        console.log("Respuesta de Gemini:", datos);
        resultadoCita.innerHTML = `
         📅 Fecha: ${datos.fecha}<br>
         🕐 Hora: ${datos.hora}<br>
         🏥 Tipo: ${datos.tipo}
`;
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
enviarCita.onclick = function () {

    if (!datosCita) {

        alert("Primero debes decir una cita.");

        return;
    }

    console.log("Cita preparada para enviar a Thunkable:");
    console.log(datosCita);

    alert(
        "Cita preparada:\n" +
        "Fecha: " + datosCita.fecha + "\n" +
        "Hora: " + datosCita.hora + "\n" +
        "Tipo: " + datosCita.tipo
    );

};