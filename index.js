#! /usr/bin/env node

const fs = require('fs');
const { exit } = require('process');
const parser = require('xml-js');
const YAML = require('yaml');
const path = require('path');

let info = {
    "lang": "json",
    "auth": "apikey",
    "folder": "",
    "config": "",
    "hub": "",
    "info": "",
    "category": "",
    "who": "support@example.com",
    "payload": 'true'
};

let index = process.argv.indexOf('-help');
if(index > -1) {
    // there's help flag
    console.log('HELP FLAGS:');
    console.log('-f: {name of the folder where de apiproxy folder is located - ex. "/folder_name"} (default > ./)');
    console.log('-out: json | yaml (default > json)');
    console.log('-auth: apikey | bearer | oauth2 (default > apikey)');
    console.log('-config: {name of the folder where de env_config.json file is located - ex. "/folder_name"} (default > ./)');
    console.log('-hub: {example: rapid}');
    console.log('-info: if ~rapid~ is chosen as the target platform, you can select the description as: short | long (default > short)');
    console.log('-cat: if ~rapid~ is chosen as the target platform, you can select the category as: ["Aftermarket Parts", "Manufacturing", "Connected Truck", "Sales and Marketing", "Warranty", "Other"] (default > Other)');
    console.log('-who: Developer/Tech Support email responsible for this API {example: support@example.com}');
    console.log('-body: false | true (default > true)');
}else {

    index = process.argv.indexOf('-out');
    if(index > -1) {
        // there's lang flag
        info.lang = process.argv[index + 1];
    }

    index = process.argv.indexOf('-auth');
    if(index > -1) {
        // there's auth flag
        info.auth = process.argv[index + 1];
    }

    index = process.argv.indexOf('-f');
    if(index > -1) {
        // there's folder flag
        info.folder = process.argv[index + 1];
    }

    index = process.argv.indexOf('-config');
    if(index > -1) {
        // there's config flag
        info.config = process.argv[index + 1];
    }

    index = process.argv.indexOf('-hub');
    if(index > -1) {
        // there's hub/platform flag
        info.hub = process.argv[index + 1];
        // review description on info and category for rapid products...
        if(info.hub == 'rapid') {
            // info
            index = process.argv.indexOf('-info');
            info.info = 'short';
            if(index > -1) {
                info.info = process.argv[index + 1];
            }
            // category for rapid products
            index = process.argv.indexOf('-cat');
            info.category = 'Other';
            if(index > -1) {
                info.category = process.argv[index + 1];
            }
        }
    }

    index = process.argv.indexOf('-who');
    if(index > -1) {
        // there's who flag
        info.who = process.argv[index + 1];
    }

    index = process.argv.indexOf('-body');
    if(index > -1) {
        // there's payload/body flag
        info.payload = process.argv[index + 1];
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

    let text_temp =  json_data.APIProxy.Description._text;
    text_temp = text_temp.toLowerCase().replace(/^./, str => str.toUpperCase());
    let general_description = text_temp;
    let long_description = "";
    if(info.info == 'long') {
        general_description = "API rev "+json_data.APIProxy._attributes.revision;
        long_description = text_temp;
    }

    result.info = {
        title: json_data.APIProxy._attributes.name,
        description: general_description,
        contact: {
            name: "API Support",
            email: info.who
        },
        license: {
            name: "Apache 2.0",
            url: "https://www.apache.org/licenses/LICENSE-2.0.html"
        },
        version: 'rev '+json_data.APIProxy._attributes.revision
    };
    if(info.hub == 'rapid') {
        result.info["x-long-description"] = long_description;
        result.info["x-category"] = info.category;
        result.info["x-public"] = false;
        result.info["x-version-lifecycle"] = 'active';
        result.info["x-collections"] = [];
    }

    // include external docs for the cli tool
    result.externalDocs = {
        description: "Find out more about ApigeeX to Open Api cli tool",
        url: "https://github.com/AlvaroSMoreno/apigeex2openapi"
    };

    let arr_servers_host = [];
    const config_file = `.${info.config}/env_config.json`;
    const data_config_file = JSON.parse(fs.readFileSync(config_file, { encoding: 'utf8', flag: 'r' }));

    for(item in data_config_file) {
        let env = data_config_file[item];
        if(env.type == 'server') {
            arr_servers_host.push({
                url: env.hostname,
                description: env.description
            });
        }
    }

    result.servers = arr_servers_host;

    const xml_file2 = `.${info.folder}/apiproxy/proxies/default.xml`;
    const xml2 = fs.readFileSync(xml_file2, { encoding: 'utf8', flag: 'r' });
    var json_data2 = JSON.parse(parser.xml2json(xml2, {
        compact: true,
        space: 4
    }));

    result.paths = {};

    let obj_arr = (json_data2.ProxyEndpoint.Flows.Flow.length != undefined)? json_data2.ProxyEndpoint.Flows.Flow : json_data2.ProxyEndpoint.Flows;

    const policies_dir_path = path.join(__dirname, `${info.folder}/apiproxy/policies`);

    for(flow in obj_arr) {
        let item = obj_arr[flow];
        const flow_condition = item.Condition._text.replaceAll('(', '').replaceAll(')', '').replaceAll('"','').replaceAll('= ','').replaceAll('=',' ').split(' ');
        let path_suffix = flow_condition[flow_condition.indexOf('MatchesPath')+1].toString();
        const http_verb = flow_condition[flow_condition.indexOf('request.verb')+1].toString();
        const description = item._attributes.name;

        const proxy_suffix_name = description.replaceAll(' ', '');

        let temp_xml_file = '';

        const filenames = fs.readdirSync(policies_dir_path);

        for(policy in filenames) {
            const file = filenames[policy];
            // we keep just the last portion after a "-" being this the name match for the cond flow
            const nm_file = file.split('.')[0].split('-')[file.split('.')[0].split('-').length - 1];
            if(nm_file == proxy_suffix_name) {
                temp_xml_file = file;
                break;
            }
        }

        let arr_payload_props = {};

        if(temp_xml_file != '') {
            const xml_policy_dir = `.${info.folder}/apiproxy/policies/${temp_xml_file}`;
            const xml_policy = fs.readFileSync(xml_policy_dir, { encoding: 'utf8', flag: 'r' });
            var json_policy = JSON.parse(parser.xml2json(xml_policy, {
                compact: true,
                space: 4
            }));
            
            const arr_json_vars = json_policy.ExtractVariables.JSONPayload.Variable;
            for(variable in arr_json_vars) {
                const field = arr_json_vars[variable];
                arr_payload_props[field._attributes.name] = {};
                arr_payload_props[field._attributes.name].type = "string";
            }

        }

        path_suffix = json_data.APIProxy.BasePaths._text+path_suffix;
        
        params_arr = [];

        if(info.hub == 'rapid') {
            params_arr.push({
                name: "apikey",
                in: "header",
                required: true,
                schema: {
                    externalDocs: {
                        url: ""
                    }
                }
            });
        }
        
        let content_conditional = {};
        result.paths[path_suffix] = {};
        // if we have path params
        let path_param = "";
        if(path_suffix.split('{').length > 2) {
            // more than 1 path parameters were found
            const arr_paths =  path_suffix.split('{');
            for(let i = 1; i < arr_paths.length; i++) {
                if(path_suffix.indexOf('}')>-1) {
                    path_param = arr_paths[i].substring(0, arr_paths[i].indexOf('}'));
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
            }
        }else {
            // only 1 path parameter was found...
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
            if(info.payload != 'true') {
                arr_payload_props = {
                    key1: {
                        type: "integer"
                    },
                    key2: {
                        type: "string"
                    },
                    key3: {
                        type: "boolean"
                    }
                };
            }
            content_conditional = {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: arr_payload_props
                    }
                }
            };

            result.paths[path_suffix][http_verb.toString().toLowerCase()].requestBody = {};
            result.paths[path_suffix][http_verb.toString().toLowerCase()].requestBody.content = content_conditional;
        }

        // security
        if(info.hub != 'rapid') {
            result.paths[path_suffix][http_verb.toString().toLowerCase()].security = [
                {
                    apikey: []
                }
            ];
        }

        if(info.auth == 'bearer') {
            result.paths[path_suffix][http_verb.toString().toLowerCase()].security.push(
                {
                    bearerAuth: []
                }
            );
        }
    }

    let security_arr = {};

    if(info.hub != 'rapid') {
        security_arr.apikey = {
            type: "apiKey",
            name: "apikey",
            in: "header"
        };
    }

    if(info.auth == 'bearer') {
        security_arr.bearerAuth = {
            type: "http",
            scheme: "bearer"
        }
    }

    if(info.auth == 'oauth2') {
        let token_url_arr = [];
        for(item in data_config_file) {
            let env = data_config_file[item];
            if(env.type == 'token_url') {
                token_url_arr.push(env.hostname);
            }
        }
        const token_url = (token_url_arr.length > 0)? token_url_arr[0] : "";
        security_arr.security_scheme_name = {
            "x-client-authentication": "BODY",
            "x-scope-separator": "COMMA",
            type: "oauth2",
            flows: {
                clientCredentials: {
                  tokenUrl: token_url
                }
            }
        }
    }

    result.components = {};

    result.components.securitySchemes = security_arr;

    if(info.hub == 'rapid') {
        result["x-gateways"] = [];

        for(item in data_config_file) {
            let env = data_config_file[item];
            if(env.type == 'server') {
                result["x-gateways"].push({
                    "url": env.hostname
                });
            }
        }
        
        result["x-documentation"] = {
            tutorials: []
        }
    }

    name_of_file = name_of_file.replaceAll('.xml', '');
    if(info.lang == 'json') {
        fs.writeFileSync(`oas_file_${name_of_file}.json`, JSON.stringify(result, null, '\t'));
        console.log('Done!');
    }else {
        const doc = new YAML.Document();
        doc.contents = result;
        fs.writeFileSync(`oas_file_${name_of_file}.yaml`, doc.toString());
        console.log('Done!');
    }
}