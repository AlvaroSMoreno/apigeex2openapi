# apigeex2openapi
Command line tool to generate OAS File from an exported API Proxy bundle from APIGEE X

![alt text](https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Apigee_logo.svg/500px-Apigee_logo.svg.png)

## Install
    npm install -g apigeex2openapi

## Help
    apigeex2openapi -help
- folder: {name of the folder where de apiproxy folder is located - ex. "/folder_name"} (default > ./)
- lang: json | yaml (default > json)
- auth: apikey | token (default > apikey)
- config: {name of the folder where de env_config.json file is located - ex. "/folder_name"} (default > ./)
    
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
    apigeex2openapi -lang yaml -folder /path_to_api_proxy_bundle

## Author
Alvaro Moreno :octocat:
