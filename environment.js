require('dotenv').config();

module.exports ={
    botToken: process.env.BOT_TOKEN,
    githubToken: process.env.GITHUB_TOKEN,
    githubRepo: process.env.GITHUB_REPO,
    port: process.env.PORT
}