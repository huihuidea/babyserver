const sessions = new Map();

function generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

module.exports = {
    sessions,
    generateToken
};
