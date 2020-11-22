require('dotenv').config();

module.exports ={
    botToken: process.env.BOT_TOKEN,
    githubToken: process.env.GITHUB_TOKEN,
    githubRepo: process.env.GITHUB_REPO,
    githubRepoIndividual:process.env.GITHUB_REPO_INDIVIDUAL,
    githubOwner: process.env.GITHUB_OWNER,
    port: process.env.PORT
}