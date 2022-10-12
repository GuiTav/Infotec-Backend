const createCon = require('./dbConnect');
const mysqlEscape = require('mysql').escape;


function put_info(reqString, callback) {

    // Transformação da string recebida pelo http em dados usáveis (formato JSON)

    try {
        var request = JSON.parse(reqString);
    }
    catch(err) {
        callback(400, null, 'formato de dados invalido');
        return;
    }

    var tabela = request.tabela;
    var dados = request.dados;
    var id = request.id + ''; // Transformação do id em string para passar pelo regex


    // Verificações de valores passados

    if (tabela == undefined || dados == undefined || id == undefined) {
        callback(400, null, 'dados nao definidos');
        return;
    }

    // Verificação de tabela

    if (!tabela.match('^[a-zA-Z]+$')) {
        callback(400, null, "tabela invalida");
        return;
    }


    // Verificação dos dados passados

    if (typeof(dados) != 'object') {
        callback(400, null, 'valores em formato invalido');
        return;
    }

    var chaves = Object.keys(dados);
    var valores = Object.values(dados);
    
    if (chaves.length == 0) {
        callback(400, null, 'dados nao passados');
        return;
    }


    // Criação do sql e verificação de cada campo passado

    sql = `UPDATE ${tabela} SET `;

    for (let i = 0; i < chaves.length; i++) {

        if (!chaves[i].match('^[a-zA-Z]+$')) {
            callback(400, null, 'coluna em formato errado');
            return;
        }

        if (i != 0) {
            sql += ', ';
        }

        // Verificação de BLOB (explicado no método POST)

        if (typeof(valores[i]) == 'string') {
            if (valores[i].match('0x[0-9a-f]+$')) {
                sql += chaves[i] + ' = ' + valores[i];
            }
            else {
                sql += chaves[i] + ' = ' + mysqlEscape(valores[i]);
            }
        } else {
            sql += chaves[i] + ' = ' + mysqlEscape(valores[i]);
        }
        
    }


    if (!id.match('^[0-9]+$')) {
        callback(400, null, 'id invalida');
        return;
    }

    sql += ` WHERE id${tabela[0].toUpperCase() + tabela.substring(1)} = ${id}`;

    

    // Conexão ao banco de dados e envio da sql

    var con = createCon();

    con.connect((err) => {
        if (err) {
            callback(503, null, 'erro de conexao');
        }
        else{
            con.query(sql, (err, result) => {
                if (err) {
                    if (err.code == 'ER_NO_SUCH_TABLE') {
                        callback(404, null, 'tabela nao encontrada');
                    }
                    else if (err.code == 'ER_BAD_FIELD_ERROR') {
                        callback(404, null, 'campo nao existente');
                    }
                    else {
                        callback(400, null, err);
                    }
                }
                else {
                    callback(200, 'sucesso', null);
                }
            });
        }
        
        con.end();
    })

}


module.exports = put_info;