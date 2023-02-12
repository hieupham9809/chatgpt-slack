const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
module.exports = {
 generate: async function (req) {
    if (!configuration.apiKey) {
      return { status: 500, message: "OpenAI API key not configured, please follow instructions in README.md" };
    }

    const { user, question } = req;
    if (question.trim().length === 0) {
      return { status: 400, message: "Please enter a valid question" };
    }

    try {
      const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: generatePrompt(question),
        user: user,
        temperature: 0.5,
        max_tokens: 500,
        frequency_penalty: 0.5,
        presence_penalty: 0.2,
      });
      return { status: 200, result: completion.data.choices[0].text };
    } catch(error) {
      // Consider adjusting the error handling logic for your use case
      if (error.response) {
        console.error(error.response.status, error.response.data);
        return { status: error.response.status, message: error.response.data };
      } else {
        console.error(`Error with OpenAI API request: ${error.message}`);
        return { status: 500, message: 'An error occurred during your request.' };
      }
    }
}
}

function generatePrompt(question) {
  const capitalizedQuestion =
    question[0].toUpperCase() + question.slice(1).toLowerCase();
  return `
  I want you to reply to all my questions in markdown format.
  Q: ${capitalizedQuestion}.
  A: `;
}

