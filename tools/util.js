
function getParam(argv, paramName, defaultValue) {
    if (argv.indexOf(paramName) != -1)
        return argv[argv.indexOf(paramName) + 1];
    else
        return defaultValue || null;
}


module.exports = {
    getParam: getParam
};