const {githubRepoIndividual,githubToken,githubOwner} = require('./environment');

const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({
    auth: `token ${githubToken}`,
    userAgent: 'GitHub Integration App'
});

const dummyData = {
    projectId: 5854371,
    projectName: 'GitHub Integration Sprint Board'
};

const options = [
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
async function getStatusDefinitions(actionId){
    const projectColumns = await octokit.projects.listColumns({
        project_id: dummyData.projectId
    });
    console.log(actionId);
    return {
        // action_id:actionId,
        // "placeholder": {
        //     "type": "plain_text",
        //     "text": "Select an issue status"
        // },
        options:
         projectColumns.data.map(column => {
            return {
                text: {
                  type: 'plain_text',
                  text: column.name
                },
                value: column.id.toString()
              }
        })
    }
}

module.exports = {
    getStatusDefinitions
}