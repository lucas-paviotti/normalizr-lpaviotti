class Producto {
    constructor(title, price, thumbnail) {
        this.title = title || '';
        this.price = price || 0;
        this.thumbnail = thumbnail || '';
    }
    /* Esta funcion existe porque al pushear en array, el objeto se guardaba como "Producto {...}". Solo se mostraba al hacer console.log esto, pero igual lo estaba guardando mal.*/
    getParsedObject() {
        let parsedJSON = JSON.stringify(this, null, 4);
        return JSON.parse(parsedJSON);;
    }
}

module.exports = Producto;