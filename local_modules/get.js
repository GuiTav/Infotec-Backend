const createCon = require('./dbConnect');

function get_info(url, callback) {

    // Separação das informações necessárias de dentro da url

    var requisition = url.split('/');
    var tabela = requisition[0];
    var id = requisition[1];
    var id2 = requisition[2];

    // Verificações de informações e elaboração do SQL

    if (!tabela.match('^[a-zA-Z]+$')) {
        callback(400, null, "tabela invalida");
        return;
    }
    
    
    // Transformando publiCompleta em um comando, e não uma tabela
    var comando = "";
    if (tabela == "publiCompleta") {
        comando = "publiCompleta";
        tabela = "publicacao";
    }


    var sql;

    if (comando == 'publiCompleta') { // Elaboração do sql caso seja feito um query pelo comando publiCompleta
        
        // Quebrei a query em várias linhas para facilitar a leitura, mesmo tendo ficado estranho
        // Eu não queria enviar o blob do anexo neste query, então selecionei todas as colunas menos a do blob do anexo

        sql = `SELECT publicacao.*, usuario.*,`;
        sql += ` GROUP_CONCAT(anexo.idAnexo) as idAnexo, GROUP_CONCAT(anexo.nomeArquivo) as nomeArquivo`;
        sql += ` FROM publicacao`;
        sql += ` LEFT JOIN anexo ON publicacao.idPublicacao = anexo.idPublicacao`;
        sql += ` LEFT JOIN usuario ON publicacao.idAutor = usuario.idUsuario`;
    }
    else {
        sql = `SELECT * FROM ${tabela}`;
    }
    

    // Construção do comando caso seja passado um ID
    var add_command = '';

    if (id != undefined) {
        if (id.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g)) {
            add_command = ` WHERE ${tabela}.email = "${id}"`;
            id2 = undefined;
        }

        else if (!id.match('^[0-9]+$')) {
            callback(400, null, "id invalido");
            return;
        }

        else {
            add_command = ` WHERE ${tabela}.id${tabela[0].toUpperCase() + tabela.substring(1)} = ${id}`;
        }

    }


    // Com dois IDs
    if (id2 != undefined) {
        if (!id2.match('^[0-9]+$')) {
            callback(400, null, "segundo id invalido");
            return;
        }
        if (parseInt(id) > parseInt(id2)) {
            callback(400, null, "primeiro id maior do que o segundo");
            return;
        }
        add_command = ` WHERE ${tabela}.id${tabela[0].toUpperCase() + tabela.substring(1)} BETWEEN ${id} AND ${id2}`;
    }


    sql += add_command;


    // O GROUP BY precisa vir depois do WHERE no publiCompleta, por isso adicionei ele aqui
    if (comando == "publiCompleta") {
        sql += " GROUP BY publicacao.idPublicacao";
    }



    // Conexão ao banco de dados e retorno de informações

    var con = createCon();

    con.connect((err) => {
        if (err) {
            callback(503, null, 'Erro de conexao');
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
                    callback(200, result, null);
                }
            });
        }

        con.end();

    });
}

module.exports = get_info;