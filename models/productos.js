let mongoose = require('mongoose');
const productosCollection = 'productos';

const ProductoEsquema = mongoose.Schema({
    title: {type: String, require: true},
    price: {type: Number, require: true},
    thumbnail: {type: String, require: true},
});

module.exports = {
    ProductoModelo: mongoose.model(productosCollection, ProductoEsquema)
}