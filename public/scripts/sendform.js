function sendForm() {
    const params = {
        title: document.querySelector('#title').value,
        price: document.querySelector('#price').value,
        thumbnail: document.querySelector('#thumbnail').value
    }
    let xhr = new XMLHttpRequest();
    xhr.open("POST", '/api/productos/guardar', true);

    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 204) {
            document.getElementById("formproducto").reset();
            document.getElementById("formproducto__span-successful").style.display = 'block';
            document.getElementById("formproducto__span-failed").style.display = 'none';
        } else {
            document.getElementById("formproducto__span-failed").style.display = 'block';
            document.getElementById("formproducto__span-successful").style.display = 'none';
        }
    }
    xhr.send(`title=${params.title}&price=${params.price}&thumbnail=${params.thumbnail}`);
}