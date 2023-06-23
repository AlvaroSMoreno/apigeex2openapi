# apigeex2openapi
Command line tool to generate OAS File from an exported API Proxy bundle from APIGEE X v2.0

![alt text](https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Apigee_logo.svg/500px-Apigee_logo.svg.png)

## Install
    npm install -g apigeex2openapi

## Help
    apigeex2openapi -help
- f: {name of the folder where de apiproxy folder is located - ex. "/folder_name"} (default > ./)
- out: Output format json | yaml (default > json)
- auth: apikey | bearer | oauth2 (default > apikey)
- config: {name of the folder where de env_config.json file is located - ex. "/folder_name"} (default > ./)
- hub: {example: rapid}
- info: if ~rapid~ is chosen as the target platform, you can select the description as: short | long (default > short)
- cat: if ~rapid~ is chosen as the target platform, you can select the category as: ["Aftermarket Parts", "Manufacturing", "Connected Truck", "Sales and Marketing", "Warranty", "Other"] (default > Other)
- who: Developer/Tech Support email responsible for this API {example: support@example.com}
    
## Create a env_config.json File
Use the following structure to add a env_config file <br>
```
    [
        {
            "name": "Development",
            "hostname": "https://api-dev.xxxx.xxxx.xxxx",
            "description": "Dev Server"
        },
        {
            "name": "Stagging",
            "hostname": "https://api-test.xxxx.xxxx.xxxx",
            "description": "Stagging Server"
        },
        {
            "name": "Production",
            "hostname": "https://api-prod.xxxx.xxxx.xxxx",
            "description": "Production Server"
        }
    ]
```

## Run a test
    apigeex2openapi -out yaml -f /path_to_api_proxy_bundle

## Try Online
    https://editor.swagger.io/ :rocket:


## Author
Alvaro Moreno :octocat:
