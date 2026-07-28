const boton = document.getElementById("microfono");

const texto = document.getElementById("texto");

const reconocimiento =
new webkitSpeechRecognition();

reconocimiento.lang = "es-ES";

reconocimiento.continuous = false;

reconocimiento.interimResults = false;
boton.onclick = function(){

texto.innerHTML = "Escuchando...";

reconocimiento.start();

}
reconocimiento.onresult = function(event){

const resultado =
event.results[0][0].transcript;

texto.innerHTML = resultado;

}
reconocimiento.onerror = function(){

texto.innerHTML =
"Ha ocurrido un error.";

}