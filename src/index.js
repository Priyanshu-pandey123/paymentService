const express = require('express');
const cors = require("cors");
const { ServerConfig } = require('./config');
const apiRoutes = require('./routes');
const {logRequest}= require('./middlewares')

const app = express();
app.use(logRequest);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/api', apiRoutes);

app.listen(ServerConfig.PORT, async (err) => {
    console.log(`Successfully started the server on PORT: ${ServerConfig.PORT}`);
});
