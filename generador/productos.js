const faker = require('faker');

faker.locale = 'es'

const get = () => ({
    title: faker.commerce.productName(),
    price: faker.commerce.price(),
    thumbnail: faker.image.image(),
});

module.exports = {
    get
}