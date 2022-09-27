var mysql = require('mysql');

function createCon() {
    var con = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        database:'infotec_bd',
        port: 3306
    });

    return con;
}

module.exports = createCon;