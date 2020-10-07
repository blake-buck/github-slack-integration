const https = require('https');
const http = require('http');
const {botToken, githubToken} = require('./environment');

function requestCallback(res, options, resolve, reject){
    if(res.statusCode === 301){
        return resolve(makeRequest(res.headers.location, options));
    }
    res.setEncoding('utf8');

    let rawData = '';
    res.on('data', (chunk) => {
        rawData += chunk;
    });

    res.on('error', (err) => reject(err));

    res.on('end', () => {
        const response = {
            headers: res.headers,
            body: JSON.parse(rawData)
        };

        if(res.statusCode >= 200 && res.statusCode < 300){
            resolve(response);
        }
        else {
            reject(response);
        }
        
    });
}
async function makeRequest(url, options){
    const {method, body, headers} = options;
    return new Promise((resolve, reject) => {
        let req;

        if(url.includes('https://')){
            req = https.request(url, {method, headers}, (res) => requestCallback(res, options, resolve, reject));
        }
        else{
            req = http.request(url, {method, headers}, (res) => requestCallback(res, options, resolve, reject));
        }

        req.on('error', (err) => reject(err));
     
        if(body){
            req.write(JSON.stringify(body));
        }
        req.end();
    })
}

async function makeGithubRequest(endpoint, {body, method}){
    const headers = {
        Authorization: `token ${githubToken}`,
        'User-Agent': 'GitHub Integration App'
    };

    return await makeRequest(`https://api.github.com/repos/${endpoint}`, {headers, body, method});
}

async function makeSlackRequest(endpoint, {body, method}){
    const headers = {
        'Content-type':'application/json',
        Authorization: `Bearer ${botToken}`
    }

    return await makeRequest(`https://slack.com/api/${endpoint}`, {headers, body, method});
}

module.exports = {
    makeRequest,
    makeGithubRequest,
    makeSlackRequest
}