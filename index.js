const {botToken, githubRepo,githubToken,githubOwner, port} = require('./environment');
const {makeGithubRequest, makeSlackRequest, makeRequest} = require('./request');
const {createDefectMessage, createDefectModal} = require('./messageBlocks');
const {parseArguments} = require('./parse-args');
const {getStatusDefinitions} = require('./getStatusDefinitions');
const { WebClient } = require('@slack/web-api');

const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({
    auth: `token ${githubToken}`,
    userAgent: 'GitHub Integration App'
});

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const slackInteractivityActions = {

    createIssue: async (payload, res) => {
        try{
            const body = {
                token: botToken,
                trigger_id: payload.trigger_id,
                view: createDefectModal(payload.message.text)
            };

            const openModal = await makeSlackRequest('views.open', {body, method:'POST'});
            return res.status(200).end();
        }
        catch(e){
            console.error('error with createIssue');
            console.error(e);
            return res.status(400).end();
        }
    },

    createIssueConfirmed: async (payload, res) => {
        if(payload.type === 'view_submission'){
            try{
                let defectTitle = payload.view.blocks.find(block => block.block_id === 'message').text.text;
                defectTitle = defectTitle.slice(1, defectTitle.length -1);
                
                let labels = payload.view.state.values.message.labelSelect.selected_options.map(option => option.value);
                const githubRequestBody = {
                    title: defectTitle,
                    labels
                };

                const githubIssueRequest = await makeGithubRequest(`${githubRepo}/issues`, {body:githubRequestBody, method:'POST'});
                

                const defectInformation = {
                    title: defectTitle,
                    creator: payload.user.username,
                    labels
                };
                const repoInformation = {
                    repo: githubRepo,
                    number: githubIssueRequest.body.number
                }
                const defectMessage = createDefectMessage(defectInformation, repoInformation);
                
                
                const slackRequestBody = {
                    ...defectMessage,
                    token: botToken
                }

                const messageRequest = await makeSlackRequest('chat.postMessage', {body:slackRequestBody, method:'POST'});
                console.log(messageRequest);
                return res.status(200).end();
            }
            catch(e){
                console.error('error with createIssueConfirmed');
                console.error(e);
                return res.status(400).end();
            }
        }
        
        return res.status(200).end();
    },

    issue_statuses: async (payload, res)=>{
        console.log(payload.state.values.section678)

        console.log(payload.state.values.section678.issue_statuses.selected_option)
        console.log(payload)
        
        
        payload.message.blocks.find(block => block.block_id === 'section678').accessory.initial_option = payload.state.values.section678.issue_statuses.selected_option;
        const slackReq = await makeRequest(payload.response_url, {method:'POST', 
        body: {
            'replace_original':true,
            blocks:payload.message.blocks
        },
        headers: {
            'Content-type': 'application/json'
        }});

        const dummyData = [
            {issueId:738562820, cardId:48944687, slackTs:'1604872600.000100', slackChannel:'C01CQGF5N2U'},
            {issueId:738634558, slackTs:'1604890691.000100', slackChannel:'C01CQGF5N2U'}
        ]
        const card = dummyData.find(card => card.slackTs === payload.container.message_ts)
        if(card && card.cardId){
            await octokit.projects.moveCard({
                position:'top',
                column_id:+payload.state.values.section678.issue_statuses.selected_option.value,
                card_id:dummyData[0].cardId
            })
        }
        else if (card){
            const result = await octokit.projects.createCard({
                column_id:+payload.state.values.section678.issue_statuses.selected_option.value,
                content_id:card.issueId,
                content_type:'Issue'
            })
            card.cardId = result.data.id;
        }
        
        return res.status(200).end();
    }

};

app.post('/slack/interactivity', express.urlencoded(),  async (req, res) => {
    const payload = JSON.parse(req.body.payload);
    let callback_id;
    if(payload.callback_id){
        callback_id = payload.callback_id;
    }
    else if(payload.view && payload.view.callback_id){
        callback_id = payload.view.callback_id;
    }
    else if(payload.response_url){
        callback_id = 'issue_statuses';
    }
    const action = slackInteractivityActions[callback_id];

    if(action){
        return action(payload, res);
    }
    
    console.error('Unrecognized interactivity action');
    return res.status(200).end();
})

app.post('/slack/get-issues', express.urlencoded(), async (req, res) => {
    // console.log(req.body)
    const query = parseArguments(req.body.text);
    const results = await octokit.issues.listForRepo({...query, owner:githubOwner});
    console.log(results)
    
    const defectMessage = {
        channel: req.body.channel_id,
        blocks: results.data.map(issue => ({
            type:'section',
            text:{
                type:'mrkdwn',
                text:`<${issue.html_url}|${issue.title}> - ${issue.state} - ${issue.user.login}`
            }
        }))
        
    }
    const slackRequestBody = {
        ...defectMessage,
        token: botToken
    }
    const messageRequest = await makeSlackRequest('chat.postMessage', {body:slackRequestBody, method:'POST'});
    return res.status(200).end();
});

const dummyData = [
    {
        slackUsername:'@blake.buck',
        githubUsername:'blake-buck'
    }
];

const githubWebhooks = {
    'review_requested': async (req, res) => {

        let requestedReviewer = dummyData.find(data => data.githubUsername === req.body.requested_reviewer.login);
        if(!requestedReviewer){
            throw new Error('User doesn\'t exist in Github Integration(instantish) DB');
        }

        let requestor = dummyData.find(data => data.githubUsername === req.body.sender.login);
        requestor = requestor ? requestor.slackUsername : req.body.sender.login;

        const defectMessage = {
            channel: requestedReviewer.slackUsername,
            blocks:[
                {
                    type:'section',
                    text:{
                        type:'mrkdwn',
                        text:`${requestor} requested you review a <${req.body.pull_request.html_url}|pull request>`
                    }
                }
            ]
        }
        const slackRequestBody = {
            ...defectMessage,
            token: botToken
        }
        const messageRequest = await makeSlackRequest('chat.postMessage', {body:slackRequestBody, method:'POST'});
        console.log(messageRequest);
        res.status(200).end();
    }
}
app.post('/github/review/requested', express.json(), async (req, res) => {
    // my dm id: 'D01BTEP10JH'
    // console.log(req.body);
    // console.log(req.body.actor);
    console.log(req.body.action);
    const action = githubWebhooks[req.body.action];
    if(action){
        return action(req, res);
    }

    res.status(404).end();
});

app.post('/slack/options', express.urlencoded(), async (req, res) => {
    const payload = JSON.parse(req.body.payload);
    const actionId = payload.action_id;
    const definitions = await getStatusDefinitions(actionId);
    res.status(200).json(definitions);
});


app.post('/github/card/moved', express.json(), async (req, res) => {
    const dummyData = [
        {issueId:738562820, cardId:48944687, slackTs:'1604872600.000100', slackChannel:'C01CQGF5N2U'},
        {issueId:738634558, slackTs:'1604890691.000100', slackChannel:'C01CQGF5N2U'}
    ]
    const web = new WebClient(/* token here */);
    

    if(req.body.action === 'moved'){
        const card = req.body.project_card;
        const column =  (await octokit.projects.getColumn({column_id:card.column_id})).data;
        const messageInfo = dummyData.find(data => data.cardId === card.id);
        let message = await web.conversations.history({
            limit:1,
            oldest:messageInfo.slackTs,
            channel:messageInfo.slackChannel
        })
        console.log(message)
        message = message.messages[0];
        message.blocks.find(block => block.block_id === 'section678').accessory.initial_option = {
            text:{
                type:'plain_text',
                text:column.name
            },
            value: column.id.toString()
        }
        const slackReq = await web.chat.update({
            blocks:message.blocks,
            ts:messageInfo.slackTs,
            channel:messageInfo.slackChannel
        }) 
    }
    res.status(200).end();
})

app.listen(port, () => console.log(`listening on port ${port}`));