const axios = require("axios");

const api = axios.create({
    baseURL: process.env.AI_SERVER_URL,
    timeout: 120000
});

module.exports = api;