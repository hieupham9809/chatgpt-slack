const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
require("dotenv").config();

var configuration, openai;
createNewOpenAIInstance();

module.exports = {
  generateResponseFrom: async function (user, text) {
    var response = await generate({ user: user, question: text });
  
    if (response.status !== 200) {
      while ([401, 429].includes(response.status)) {
        response = await generate({ user: user, question: text });
      }
      if (response.status != 200) {
        throw new Error(`Request failed with status ${response.status}, error: ${response.message}`);
      }
    }

    return response;
  },

  generateResponseWithRandomErrorFrom: async function () {
    if ((Math.floor(Math.random() * (99999 - 1 + 1)) + 1) % 3 == 0) {
      return { status: 200, result: "hello world!"};
    } 
    throw {response: {status: 401, data: "API invalid"}};
  }
}

async function generate(req) {
  if (!configuration.apiKey) {
    return { status: 500, message: "OpenAI API key not configured, please follow instructions in README.md" };
  }

  const { user, question } = req;
  console.log(req);
  if (question.trim().length === 0) {
    return { status: 400, message: "Please enter a valid question" };
  }

  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: generatePrompt(question),
      user: user,
      temperature: 0.5,
      max_tokens: 1000,
      frequency_penalty: 0.5,
      presence_penalty: 0.2,
    });
    return { status: 200, result: completion.data.choices[0].text };
  } catch(error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      // handle api key invalid error
      if ([401, 429].includes(error.response.status)) {
        let currentKey = configuration.apiKey;
        updateInvalidKeysList(currentKey)
        if (createNewOpenAIInstance()) {
          console.error(error.response.status, 'API key invalid, updated a new one and need to retry the request.')
          return { status: error.response.status, message: error.response.data };
        } else {
          console.error(error.response.status, 'can not renew API key');
          return { status: 500, message: 'An error occurred during your request.' };
        } 
      }
      console.error(error.response.status, error.response.data);
      return { status: error.response.status, message: error.response.data };
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      return { status: 500, message: 'An error occurred during your request.' };
    }
  }
}

function createNewOpenAIInstance() {
  let invalidKeyList = fs.readFileSync(`${process.env.OPENAI_API_INVALID_KEY_PATH}`, 'utf-8').split('\n');
  let keyList = fs.readFileSync(`${process.env.OPENAI_API_KEY_PATH}`, 'utf-8')
    .split('\n').filter(item => { return !invalidKeyList.includes(item) });
  if (keyList.count == 0) {
    return false;
  }
  let key = keyList[0];
  configuration = new Configuration({ apiKey: key });
  openai = new OpenAIApi(configuration);
  console.log(`Got a new key and configure a new instance with key: ${key}`);
  return true;
}

function updateInvalidKeysList(invalidKey) {
  console.log(`going to update the invalid key list with key: ${invalidKey}`);
  fs.writeFileSync(`${process.env.OPENAI_API_INVALID_KEY_PATH}`, `${invalidKey}\n`, { flag: 'a' });
}

function generatePrompt(question) {
  const capitalizedQuestion =
    question[0].toUpperCase() + question.slice(1).toLowerCase();
  return `
  I want you to reply to all my questions in markdown format.
  Q: ${capitalizedQuestion}.
  A: `;
}

