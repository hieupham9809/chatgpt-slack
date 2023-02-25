// only for local debugging
var generateResponseFrom = require("./api/generate").generateResponseFrom;
const express = require('express');
const debugApp = express();
debugApp.use(express.json());
debugApp.post('/debug-chatgpt', async (req, res) => {
    console.log(req.body);
    const {user, text} = req.body.data;
    try {
        let response = await generateResponseFrom(user, text);
        res.send(response.result);
    } catch(error) {
        console.error(error); 
    }
    
});
debugApp.listen(3333, () => console.log('Server started on port 3333'));