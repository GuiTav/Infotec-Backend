const createCon = require('./dbConnect');

function delete_info(url, callback) {
    
    // Separação de informações

    var requisition = url.split('/');
    var tabela = requisition[0];
    var idString = requisition[1];


    // Verificações e criação do sql

    if (tabela == undefined || idString == undefined) {
        callback(400, null, 'dados nao definidos');
        return;
    }

    if (!tabela.match('^[a-zA-Z]+$')) {
        callback(400, null, "tabela invalida");
        return;
    }


    var id = idString.split("-");

    for (let i = 0; i < id.length; i++) {
        if (!id[i].match('^[0-9]+$')) {
            callback(400, null, "id invalido");
            return;
        }
    }

    var sql = `DELETE FROM ${tabela} WHERE id${tabela[0].toUpperCase() + tabela.substring(1)} IN (`;
    for (let i = 0; i < id.length; i++) {
        if (i != 0) {
            sql += ",";
        }
        sql += id[i]
    }
    sql += ')';


    // Conexão e query

    var con = createCon();

    con.connect((err) => {
        if (err) {
            callback(503, null, 'erro de conexao');
        }
        else {
            con.query(sql, (err, result) => {
                if (err) {
                    if (err.code == 'ER_NO_SUCH_TABLE') {
                        callback(404, null, 'tabela inexistente');
                    }
                    else {
                        callback(400, null, err);
                    }
                }

                else {
                    if (result.affectedRows == 0) {
                        callback(404, null, 'registro nao existente');
                    }
                    else {
                        callback(200, 'sucesso', null);
                    }
                }
            });
        }

        con.end();
    });
}

module.exports = delete_info;