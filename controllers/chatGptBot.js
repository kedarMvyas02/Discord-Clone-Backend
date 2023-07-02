const axios = require("axios");
const asyncHandler = require("express-async-handler");

const openaiApiKey = process.env.OPENAI_API_KEY;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${openaiApiKey}`,
};

const getAnswerFromGpt = asyncHandler(async (req, res, next) => {
  const prompt = req.body.prompt;

  const data = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: { prompt } }],
    temperature: 0.7,
  };

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    data,
    { headers }
  );

  const message = response?.data?.choices[0]?.message?.content;

  return message;
});

module.exports = {
  getAnswerFromGpt,
};
