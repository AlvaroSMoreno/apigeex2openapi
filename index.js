#! /usr/bin/env node

const fs = require('fs');
const parser = require('xml-js');
const YAML = require('yaml');

let info = {
    "lang": "json",
    "auth": "apikey",
    "folder": ""
};

let index = process.argv.indexOf('-help');
if(index > -1) {
    // there's help flag
    console.log('HELP FLAGS:');
    console.log('-folder: {name of the folder where de apiproxy folder is located - ex. "/folder_name"} (default > ./)');
    console.log('-lang: json | yaml (default > json)');
    console.log('-auth: apikey | token (default > apikey)');
}else {

    index = process.argv.indexOf('-lang');
    if(index > -1) {
        // there's lang flag
        info.lang = process.argv[index + 1];
    }

    index = process.argv.indexOf('-auth');
    if(index > -1) {
        // there's auth flag
        info.auth = process.argv[index + 1];
    }

    index = process.argv.indexOf('-folder');
    if(index > -1) {
        // there's folder flag
        info.folder = process.argv[index + 1];
    }

    let name_of_file = '';
    fs.readdirSync(`.${info.folder}/apiproxy/`).forEach(file => {
    if(file.includes('.xml')) {
        name_of_file = file;
    }
    });

    const xml_file = `.${info.folder}/apiproxy/${name_of_file}`;
    const xml = fs.readFileSync(xml_file, { encoding: 'utf8', flag: 'r' });
    var json_data = JSON.parse(parser.xml2json(xml, {
        compact: true,
        space: 4
    }));

    let result = {};
    result.openapi = "3.0.1"
    result.info = {
        title: json_data.APIProxy._attributes.name,
        description: json_data.APIProxy.Description._text,
        contact: {
            name: "API Support",
            email: "support@example.com"
        },
        license: {
            name: "Apache 2.0",
            url: "https://www.apache.org/licenses/LICENSE-2.0.html"
        },
        version: 'rev '+json_data.APIProxy._attributes.revision
    };
    result.servers =
        [
        {
            url: "https://api-dev.digital.paccar.cloud"+json_data.APIProxy.BasePaths._text,
            description: "Development server"
        },
        {
            url: "https://api-test.digital.paccar.cloud"+json_data.APIProxy.BasePaths._text,
            description: "Testing server"
        },
        {
            url: "https://api-qa.digital.paccar.cloud/"+json_data.APIProxy.BasePaths._text,
            description: "Staging server"
        },
        {
            url: "https://api-prod.digital.paccar.cloud/"+json_data.APIProxy.BasePaths._text,
            description: "Production server"
        }
        ];

    const xml_file2 = `.${info.folder}/apiproxy/proxies/default.xml`;
    const xml2 = fs.readFileSync(xml_file2, { encoding: 'utf8', flag: 'r' });
    var json_data2 = JSON.parse(parser.xml2json(xml2, {
        compact: true,
        space: 4
    }));

    result.paths = {};

    for(flow in json_data2.ProxyEndpoint.Flows) {
        let item = json_data2.ProxyEndpoint.Flows[flow];
        const path_suffix = item.Condition._text.split(' ')[item.Condition._text.split(' ').indexOf('MatchesPath')+1].replaceAll('"','').replaceAll(')','').replaceAll('(','');
        const http_verb = item.Condition._text.split(' ')[item.Condition._text.split(' ').indexOf('(request.verb')+2].replaceAll('"','').replaceAll(')','').replaceAll('(','');
        const description = item._attributes.name;
        params_arr = [
            {
                name: "apikey",
                in: "header",
                schema: {
                    type: "string",
                    example: "{client_id}"
                }
            } 
        ];
        if(info.auth == 'token') {
            params_arr.push({
                name: "Authorization",
                in: "header",
                schema: {
                    type: "string",
                    example: "Bearer {access_token}"
                }
            });
        }
        result.paths[path_suffix] = {};
        result.paths[path_suffix][http_verb.toString().toLowerCase()] = {
            description: description,
            requestBody: {
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                key1: {
                                    type: "integer"
                                },
                                key2: {
                                    type: "string"
                                }
                            }
                        }
                    }
                }
            },
            parameters: params_arr,
            responses: {
                "200": {
                    description: "Successful Response",
                },
                "500": {
                    description: "Server Error",
                },
                "404": {
                    description: "Not Found",
                },
                "401": {
                    description: "Not Authorized",
                }
            }
        };
    }

    name_of_file = name_of_file.replaceAll('.xml', '');
    if(info.lang == 'json') {
        fs.writeFileSync(`oas_file_${name_of_file}.json`, JSON.stringify(result));
        console.log('Done!');
    }else {
        const doc = new YAML.Document();
        doc.contents = result;
        fs.writeFileSync(`oas_file_${name_of_file}.yaml`, doc.toString());
        console.log('Done!');
    }
}
