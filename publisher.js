require('dotenv').config();

module.exports = {
    transport: {
    	module: 'github',
        token: process.env.GITHUB_TOKEN
    }
};
