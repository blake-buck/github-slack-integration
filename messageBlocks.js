function createDefectMessage({title, creator, labels}, {repo, number}){
    const defectMessage = {
        channel: '#defects',
        blocks: [
            {
                type: "section",
                text: {
                    "type": "mrkdwn",
                    "text": `@${creator} created an issue in <https://github.com/${repo}|${repo}>`
                }
            },
            {
                type: 'section',
                text:{
                    type:'mrkdwn',
                    text: `<https://github.com/${repo}/issues/${number}|${title}>`
                }
            }
        ]
    }

    if(labels.length){
        defectMessage.blocks = [
            ...defectMessage.blocks, 
            {
                type: 'section',
                text:{
                    type:'mrkdwn',
                    text:`*Labels:* ${labels.join(', ')}`
                }
            }
        ];
    }

    return defectMessage
}

function createDefectModal(defectTitle){
    return {
        type: 'modal',
        title: {
            type: 'plain_text',
            text: 'Create Defect'
        },
        callback_id: 'createIssueConfirmed',
        submit: {
            type: 'plain_text',
            text: 'Submit'
        },
        blocks: [
            {
                block_id: 'message',
                type: 'section',
                text:{
                    type: 'mrkdwn',
                    text:'*' + defectTitle+ '*'
                },
                accessory:{
                    action_id:'labelSelect',
                    type:'multi_static_select',
                    placeholder:{
                        type:'plain_text',
                        text:'Select any relevant labels'
                    },
                    options:[
                        {
                            text:{
                                type: 'plain_text',
                                text: 'bug'
                            },
                            value:'bug'
                        },
                        {
                            text:{
                                type: 'plain_text',
                                text: 'dependencies'
                            },
                            value:'dependencies'
                        },
                        {
                            text:{
                                type: 'plain_text',
                                text: 'duplicate'
                            },
                            value:'duplicate'
                        },
                        {
                            text:{
                                type: 'plain_text',
                                text: 'help wanted'
                            },
                            value:'help wanted'
                        },
                    ]
                }
            },
            
        ]
    }
}

module.exports = {
    createDefectMessage,
    createDefectModal
}