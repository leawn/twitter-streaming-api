const needle = require('needle');
const config = require('dotenv').config();
const TOKEN = process.env["TWITTER_BEARER_TOKEN "];

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamUrl = 'https://api.twitter.com/2/tweets/search/stream?tweet.field=public_metrics&expansions=author_id';

const rules = [{ value: 'giveaway' }];

//get stream rules
/*async function getRules() {
    const response = await needle('get', rulesURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    })

    return response.body;
}*/

const getRules = (req, res, next) => {
    needle('get', rulesURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    })
        .then(result => {
            console.log(result.body);
            return result;
        })
        .catch(err => {
            next(err); //don't have error middleware for now
        });
}

(async () => {
    let currentRules;

    try {
        currentRules = await getRules()
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
})()
