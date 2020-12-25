const needle = require('needle');
const config = require('dotenv').config();
const TOKEN = process.env.TWITTER_BEARER_TOKEN;

console.log(TOKEN);

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules'
const streamURL = 'https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id';

const rules = [
    { 'value': 'giveaway' }
];

async function getRules() {

    const response = await needle('get',
        rulesURL,
        {
            headers: {
            "Authorization": `Bearer ${TOKEN}`
            }
        })

    if (response.statusCode !== 200) {
        throw new Error(response.body);
        return null;
    }

    return (response.body);
}

async function deleteRules(rules) {

    if (!Array.isArray(rules.data)) {
        return null;
    }

    const ids = rules.data.map(rule => rule.id);

    const data = {
        "delete": {
            "ids": ids
        }
    }

    const response = await needle('post', rulesURL, data, {headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${TOKEN}`
        }})

    if (response.statusCode !== 200) {
        throw new Error(response.body);
        return null;
    }

    return (response.body);

}

async function setRules() {

    const data = {
        "add": rules
    }

    const response = await needle(
        'post',
        rulesURL,
        data,
        {
            headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${TOKEN}`
            }
        })

    if (response.statusCode !== 201) {
        throw new Error(response.body);
        return null;
    }

    return (response.body);

}

function streamConnect() {
    const options = {
        timeout: 20000
    }

    const stream = needle.get(streamURL, {
        headers: {
            'Authorization': `Bearer ${TOKEN}`
        }
    }, options);

    stream.on('data', data => {
        try {
            const json = JSON.parse(data);
            console.log(json);
        } catch (e) {
        }
    }).on('error', error => {
        if (error.code === 'ETIMEDOUT') {
            stream.emit('timeout');
        }
    });

    return stream;

}

function streamTweets() {
    const stream = needle.get(streamURL, {
        headers: {
            'Authorization': `Bearer ${TOKEN}`
        }
    })

    stream.on('data', (data) => {
        try {
            const json = JSON.parse(data);
            console.log(json);
        } catch (error) {}
    })
}


(async () => {
    let currentRules;

    try {
        currentRules = await getRules();
        await deleteRules(currentRules);
        await setRules();

    } catch (e) {
        console.error(e);
        process.exit(1);
    }

    const filteredStream = streamConnect()
    let timeout = 0;
    filteredStream.on('timeout', () => {
        console.warn('A connection error occurred. Reconnecting…');
        setTimeout(() => {
            timeout++;
            streamConnect(TOKEN);
        }, 2 ** timeout);
        streamConnect(TOKEN);
    })

})();
