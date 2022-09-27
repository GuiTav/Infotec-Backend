var createCon = require('./dbConnect');
var mysqlEscape = require('mysql').escape;

function post_info(req_string, callback) {
    
    // Transformação da informação em dados usáveis
    
    try {
        request = JSON.parse(req_string);
    } catch (error) {
        callback(400, null, 'formato de dados invalido');
        return;
    }

    var tabela = request.tabela;
    var dados = request.dados;
    var anexo = request.anexo;


    // Verificações do JSON

    if (tabela == undefined || dados == undefined) {
        callback(400, null, 'dados nao definidos');
        return;
    }


    // Verificação de tabela

    if (!tabela.match('^[a-zA-Z]+$')) {
        callback(400, null, "tabela invalida");
        return;
    }

    /* Para facilitar o envio de infos, os anexos poderão ser adicionados por meio da publicação,
    evitando realizar duas requisições separadas, uma pra postar a publicação e a outra pra fazer o
    envio do anexo. */
    if (tabela == 'publicacao') {

        // Verificação do anexo

        if (anexo != undefined) {
            if (!Array.isArray(anexo)) {
                callback(400, null, 'anexo em formato invalido');
                return;
            }

            else {
                if (anexo.length != 2) {
                    callback(400, null, 'informacoes de anexo fora da quantidade esperada');
                    return;
                }
            }
        }
    }


    // Verificações dos valores passados

    if (!Array.isArray(dados)) {
        callback(400, null, 'valores em formato invalido');
        return;
    }

    if (dados.length == 0) {
        callback(400, null, 'dados vazios');
        return;
    }



    // Criação do sql

    var cleanSql = createSql(tabela, dados);
    if (cleanSql.err != undefined) {
        callback(400, null, sql.err);
        return;
    }


    // Conexão ao banco de dados e envio de informações
    
    var con = createCon();

    con.connect((err) => {

        if (err) {
            callback(503, null, 'erro de conexao');
        }
        else{
            con.query(cleanSql.sql, (err, result) => {
                if (err) {
                    if (err.code == 'ER_WRONG_VALUE_COUNT_ON_ROW'){
                        callback(400, null, 'a quantidade de valores nao combina com as colunas da tabela passada');
                    }
                    else if (err.code == 'ER_NO_SUCH_TABLE') {
                        callback(404, null, 'tabela nao encontrada');
                    }
                    else {
                        callback(400, null, err);
                    }
                }

                else { // Caso seja enviado um anexo, ele realiza um segundo query
                    if (tabela == 'publicacao' && anexo != undefined) {

                        var sqlAnexo = createSql('anexo', anexo, result.insertId);
                        if (sqlAnexo.err != undefined) {
                            callback(400, null, sqlAnexo.err);
                        }
                        else {
                            con.query(sqlAnexo, (errAnexo, resultAnexo) => {
            
                                if (errAnexo) {
                                    //console.log(sqlAnexo);
                                    callback(400, null, 'erro inesperado durante a insercao do anexo. ' + errAnexo);
                                }
            
                                else{
                                    callback(200, "sucesso", null);
                                }
                            });
                            
                        }
        
                    }

                    else {
                        callback(200, "sucesso", null);
                    }
                }

                con.end();
            });

        }
    })
}



// Função separada apenas para lidar com a criação de query, já que as queries desse possuem mais regras e
// podem ser usadas mais de uma vez.
function createSql(table, data, postIndex) {
    var sql = `INSERT INTO ${table} VALUES `;

    // Caso seja necessário enviar dois anexos numa mesma requisição, o programa é capaz de lidar com isso
    var isArr = false;
    var isOther = false;

    for (let i = 0; i < data.length; i++) {
        if (Array.isArray(data[i])) {
            isArr = true;
        }
        else {
            isOther = true;
        }
    }

    if (isArr && isOther) {
        return {'err': 'Dois tipos de valores diferentes passados nos dados'};
    }

    if (isArr) {
        for (let i = 0; i < data.length; i++) {
            var element = data[i];
            var values = mysqlEscape(element);
            var valObj = /'0x[a-f0-9]+'/.exec(values);
            if (valObj != null) {
                values = values.replace(/'0x[a-f0-9]+'/, valObj[0].slice(1, -1));
            }
            if (i != 0) {
                sql += ',';
            }

            sql += '(null, ' + values;

            if (postIndex != undefined) {
                sql += ', ' + postIndex;
            }

            sql += ')';
        }

        return {'sql': sql};
    }

    var values = mysqlEscape(data);
    var valObj = /'0x[a-f0-9]+'/.exec(values);
    if (valObj != null) {
        values = values.replace(/'0x[a-f0-9]+'/, valObj[0].slice(1, -1));
    }

    sql += '(null, ' + values;

    if (postIndex != undefined) {
        sql += ', ' + postIndex;
    }

    sql += ')';

    return {'sql': sql};
}




module.exports = post_info;