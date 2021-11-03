let mongoose = require('mongoose');
const mensajesCollection = 'mensajes';

const MensajeEsquema = mongoose.Schema({
    author: {
        id: String,
        nombre: String,
        apellido: String,
        edad: Number,
        alias: String,
        avatar: String,
    },
    date: {type: Date, require: true},
    text: {type: String, require: true}
});

module.exports = {
    MensajeModelo: mongoose.model(mensajesCollection, MensajeEsquema)
}