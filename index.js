var http = require("http");
var fs = require('fs');
var get_info = require('./local_modules/get'); 
var post_info = require('./local_modules/post');
var put_info = require('./local_modules/put');
var delete_info = require('./local_modules/delete');


/* var options = {
    key: fs.readFileSync('key.pem'),
    passphrase: 'babloigue',
    cert: fs.readFileSync('cert.pem')
} */


const server = http.createServer(/* options, */ (req, res) => {
    res.setHeader('Content-Type', 'application/json;'); // Criação do cabeçalho da resposta

    // Separação de cada ação por método http

    if (req.method == "GET") {
        /*
        
        O método GET não permite a criação de um corpo para o require, por isso envio informações
        via URL, após o endereço do servidor. Ex: https://{endereço}/{tabela}/{id}
        
        */

        var cleanUrl = req.url.substring(1); // Pegando url limpa para enviar para a função de tratamento

        get_info(cleanUrl, (code, message, error) => {
            res.statusCode = code;
            res.write(JSON.stringify({'resposta': message, 'erro': error}));
            res.end();
        });
    }

    else if (req.method == "POST") {
        
        /*
        
        O corpo do request chega após o cabeçalho, mas é o cabeçalho que ativa este callback. É necessário
        receber o corpo em partes, chamadas chunks, por isso precisa de um evento para ouvir cada vez
        que uma parte do corpo chegar, e assim adicionar essa parte ao resto.
        
        */

        var request = '';
        req.on('data', (chunk) => {
            request += chunk;
        });

        // Ao fim da chegada de dados, a API pode processar os dados e enviar uma resposta.

        req.on('end', () => {
            post_info(request, (code, message, error) => {
                res.statusCode = code;
                res.write(JSON.stringify({'resposta': message, 'erro': error}));
                res.end();
            })
        });
    }

    else if (req.method == 'PUT') {

        var request = '';

        req.on('data', (data) => {
            request += data;
        });

        req.on('end', () => {
            put_info(request, (code, message, error) => {
                res.statusCode = code;
                res.write(JSON.stringify({'resposta': message, 'erro': error}));
                res.end();
            });
        });
    }

    else if (req.method == 'DELETE') {

        /*
        
        O método DELETE também não permite a criação de um corpo, por isso a tabela e o id deverão ser enviados
        pelo path. Ex: https://{endereço}/{tabela}/{id}
        
        */
        
        var cleanUrl = req.url.substring(1); // Pegando url limpa para enviar para a função de tratamento

        delete_info(cleanUrl, (code, message, error) => {
            res.statusCode = code;
            res.write(JSON.stringify({'resposta': message, 'erro': error}));
            res.end();
        });
    }
}).listen(8000);

