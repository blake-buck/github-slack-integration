function parseArguments(str){
    const hashmap = {
        '-d':'since',
        '-l':'labels',
        '-s':'state',
        '-c':'creator',
        '-a':'assignee',
        '-m':'milestone',
        '-p':'page'
    }
    const repo = str.match(/(\w|\d|-)+/)[0];
    
    const flagsPlusContent = str.match(/-\w (\w|-|\d| \w|,)+/g);

    const queryInfo = {}
    if(flagsPlusContent){
        flagsPlusContent.forEach(str => {
            const flag=str.slice(0, 2);
            const property = hashmap[flag];
            queryInfo[property] = str.slice(3);
            if(property === 'since'){
                queryInfo[property] +='T00:00:00Z';
            }
        });
    }
    

    return {
        repo,
        ...queryInfo
    }
}

module.exports = {
    parseArguments
}