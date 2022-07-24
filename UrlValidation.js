function connect(query) {
    if (query.includes("https://", 0)) {
        return query;
    } else {
        return false;
    }
}

module.exports = {
    connect
}