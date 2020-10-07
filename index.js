const {botToken, githubRepo, port} = require('./environment');
const {makeGithubRequest, makeSlackRequest} = require('./request');
const {createDefectMessage, createDefectModal} = require('./messageBlocks');

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

                return res.status(200).end();
            }
            catch(e){
                console.error('error with createIssueConfirmed');
                console.error(e);
                return res.status(400).end();
            }
        }
        
        return res.status(200).end();
    }

};

app.post('/slack/interactivity', express.urlencoded(),  async (req, res) => {
    const payload = JSON.parse(req.body.payload);

    const callback_id = payload.callback_id ? payload.callback_id : payload.view.callback_id;

    const action = slackInteractivityActions[callback_id];

    if(action){
        return action(payload, res);
    }
    
    console.error('Unrecognized interactivity action');
    return res.status(404).end();
})


app.listen(port, () => console.log(`listening on port ${port}`));