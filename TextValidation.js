
function connect(query,length) {
    if (query.length >= length) {
        return query;
    } else {
        return false;
    };
};

module.exports = {
    connect
}