function connect(query) {
    if (query.includes("@") && query.includes(".") && query.length > 10) {
        return query;
    } else {
        return false;
    };
};

module.exports = {
    connect
}