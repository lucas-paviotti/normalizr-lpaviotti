const express = require('express');
const Producto = require('./modules/producto.js');
const exphbs = require('express-handlebars');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
let { ProductoModelo } = require('./models/productos');
let { MensajeModelo } = require('./models/mensajes');
const generador = require('./generador/productos');
const {normalize, schema} = require('normalizr');

const app = express();
const PORT = process.env.PORT || 8080;
const routerApi = express.Router();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(`${__dirname}/public`));
app.use('/api', routerApi);

const server = app.listen(PORT, () => {
    console.log(`Servidor http escuchando en el puerto ${server.address().port}`);
});

server.on("error", error => console.log(`Error en servidor ${error}`));

app.engine(
    "hbs",
    exphbs({
        extname: ".hbs",
        defaultLayout: "index",
        layoutsDir: `${__dirname}/views/layouts`,
        partialsDir: `${__dirname}/views/partials`
    })
);

app.set('views', './views');
app.set('view engine', 'hbs');

const mongoURI = 'mongodb://localhost:27017/ecommerce';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 1000
});
mongoose.connection.on("error", err => {
  console.log("err", err)
});
mongoose.connection.on("connected", (err, res) => {
  console.log("mongoose está conectado")
});

const autoresSchema = new schema.Entity('autores');
const mensajesSchema = new schema.Entity('mensajes',{
    autores: autoresSchema
});

routerApi.get('/productos/listar', async (req, res) => {
    try {
        let producto = await ProductoModelo.find({});
        if (producto.length) {
            res.status(200).json(producto);
        } else {
            res.status(404).json({error: 'No hay productos.'});
        }
    }
    catch(e) {
        res.status(500).json({error: 'Error al buscar documentos.'});
        throw `Error al buscar documentos: ${e}`;
    }
});

routerApi.get('/productos/listar/:id', async (req, res) => {
    try {
        let { id } = req.params;

        let producto = await ProductoModelo.find({_id: id});

        if (producto.length) {
            res.status(200).json(producto);
        } else {
            res.status(404).json({error: 'No se encontró producto con ese ID.'});
        }
    }
    catch(e) {
        res.status(500).json({error: 'El formato de ID es incorrecto.'});
        throw `Error al buscar documento: ${e}`;
    }
});

routerApi.post('/productos/guardar/', async (req, res) => {
    try {
        let { title, price, thumbnail } = req.body;
        let producto = new Producto(title,price,thumbnail);
        
        const nuevoProducto = new ProductoModelo({
            title: producto.title,
            price: producto.price,
            thumbnail: producto.thumbnail
        });

        await nuevoProducto.save();
        
        res.status(200).json(nuevoProducto);
    }
    catch(error) {
        res.status(500).json({error: 'No se pudo agregar el producto.'});
        throw `Error al agregar documento: ${e}`;
    }
});

routerApi.put('/productos/actualizar/:id', async (req, res) => {
    try {
        let { id } = req.params;
        let { title, price, thumbnail } = req.body;

        let producto = await ProductoModelo.find({_id: id});

        if (producto.length) {
            await ProductoModelo.updateOne({_id: id}, {title: title, price: price, thumbnail: thumbnail});
            res.status(200).json(producto);
        } else {
            res.status(404).json({error: 'No se encontró producto con ese ID.'});
        }
    }
    catch(e) {
        res.status(500).json({error: 'No se pudo editar el producto o el formato de ID es incorrecto.'});
        throw `Error al editar documento: ${e}`;
    }
});

routerApi.delete('/productos/borrar/:id', async (req, res) => {
    try {
        let { id } = req.params;

        let producto = await ProductoModelo.find({_id: id});

        if (producto.length) {
            await ProductoModelo.deleteOne({_id: id});
            res.status(200).json(producto);
        } else {
            res.status(404).json({error: 'No se encontró producto con ese ID.'});
        }
    }
    catch(e) {
        res.status(500).json({error: 'No se pudo eliminar el producto o el formato de ID es incorrecto.'});
        throw `Error al eliminar documento: ${e}`;
    }
});

app.get('/', (req, res) => {
    res.render('formulario');
});

app.get('/productos/vista', async (req, res) => {
    try {
        let productos = await ProductoModelo.find({});
        res.render('productos', { listaProductos: JSON.parse(JSON.stringify(productos, null, 4)) });
    }
    catch(e) {
        throw `No se pudieron renderizar los productos: ${e}`;
    }
});

app.get('/productos/vista-test', async (req, res) => {
    try {
        let productos = [];
        let cant = req.query.cant || 10;
        for (let i = 0; i < cant; i++) {
            productos.push(generador.get());
        }
        res.render('productos', { listaProductos: JSON.parse(JSON.stringify(productos, null, 4)) });
    }
    catch(e) {
        throw `No se pudieron renderizar los productos: ${e}`;
    }
});

const io = new Server(server);

io.on("connection", async (socket) => {
    console.log('Escuchando socket');

    try {
        let productos = await ProductoModelo.find({});
        socket.emit('listaProductos', productos);
    }
    catch(e) {
        throw `No se pudieron enviar los productos a traves de websocket: ${e}`;
    }
    
    socket.on('nuevoProducto', async (data) => {
        try {
            let { title, price, thumbnail } = data;
            let producto = new Producto(title,price,thumbnail);
            
            const nuevoProducto = new ProductoModelo({
                title: producto.title,
                price: producto.price,
                thumbnail: producto.thumbnail
            });
    
            await nuevoProducto.save();            
        }
        catch(e) {
            throw `Error al agregar producto a través de websocket: ${e}`;
        }
        finally {
            let productos = await ProductoModelo.find({});
            socket.emit('listaProductos', productos);
        }
    });

    try {
        let mensajes = await MensajeModelo.find({});
        const normalizedData = normalize(mensajes, mensajesSchema);
        console.log(mensajes, normalizedData);
        socket.emit('nuevoMensaje', mensajes);
    }
    catch(e) {
        throw `No se pudieron enviar los mensajes a traves de websocket: ${e}`;
    }

    socket.on('nuevoMensaje', async (data) => {
        try {
            let { email, nombre, apellido, edad, alias, avatar, date, text } = data;

            const nuevoMensaje = new MensajeModelo({
                author: {
                    id: email,
                    nombre: nombre,
                    apellido: apellido,
                    edad: edad,
                    alias: alias,
                    avatar: avatar,
                },
                date: date,
                text: text
            });
    
            await nuevoMensaje.save();
        }
        catch(e) {
            throw `Error al agregar mensaje a través de websocket: ${e}`;
        }
        finally {
            let mensajes = await MensajeModelo.find({});
            socket.emit('nuevoMensaje', mensajes);
        }
    });
});



/*
OBJETO PARA PRUEBA:
{
    "title": "Juego de mesa Carcassonne",
    "price": 5840,
    "thumbnail": "https://http2.mlstatic.com/D_NQ_NP_824823-MLA45578263264_042021-O.webp"
}
*/

