module.exports = (s) => {
    let log = document.getElementById('content-log');
    if (log) {
        log.innerHTML += s + '<br>';
    } else {
        console.log(s);
    }
};