#! /usr/bin/env node

const fs = require('fs');
const { exit } = require('process');
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

    let obj_arr = (json_data2.ProxyEndpoint.Flows.Flow.length != undefined)? json_data2.ProxyEndpoint.Flows.Flow : json_data2.ProxyEndpoint.Flows;

    for(flow in obj_arr) {
        let item = obj_arr[flow];
        const flow_condition = item.Condition._text.replaceAll('(', '').replaceAll(')', '').replaceAll('"','').replaceAll('= ','').replaceAll('=',' ').split(' ');
        const path_suffix = flow_condition[flow_condition.indexOf('MatchesPath')+1].toString();
        const http_verb = flow_condition[flow_condition.indexOf('request.verb')+1].toString();
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
        let content_conditional = {};
        result.paths[path_suffix] = {};
        // if we have path params
        let path_param = "";
        if(path_suffix.indexOf('{')>-1) {
            path_param = path_suffix.substring(path_suffix.indexOf('{')+1, path_suffix.indexOf('}'));
            params_arr.push({
                name: path_param,
                in: "path",
                required: true,
                schema: {
                    type: "string",
                    example: `{${path_param}}`
                }
            });
        }
        result.paths[path_suffix][http_verb.toString().toLowerCase()] = {
            description: description,
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
        if(http_verb.toString().toLowerCase() == 'post' || http_verb.toString().toLowerCase() == 'put') {
            content_conditional = {
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
            };
            result.paths[path_suffix][http_verb.toString().toLowerCase()].requestBody = {};
            result.paths[path_suffix][http_verb.toString().toLowerCase()].requestBody.content = content_conditional;
        }
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
