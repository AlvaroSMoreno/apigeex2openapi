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
    
## Run a test
    apigeex2openapi -lang yaml -folder /path_to_api_proxy_bundle

## Author
Alvaro Moreno :octocat:
