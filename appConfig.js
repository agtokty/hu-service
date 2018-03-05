
var developmentDatabase = {
    postgres: {
        host: 'localhost',
        port: 5432,
        database: 'huservice',
        user: 'postgres',
        password: 'postgres'
    }
}

if (process.env.NODE_ENV == 'production') {
    
    // process.env.DATABASE_URL = ""

    if (process.env.DATABASE_URL) {
        var myString = process.env.DATABASE_URL;
        var myRegexp = /(\w+):(\w+)@(.+):(\w+)\/(\w+)/g;
        var match = myRegexp.exec(myString);

        if (match.length == 6) {
            developmentDatabase.postgres.user = match[1];
            developmentDatabase.postgres.password = match[2];
            developmentDatabase.postgres.host = match[3];
            developmentDatabase.postgres.port = Number(match[4]);
            developmentDatabase.postgres.database = match[5];
            developmentDatabase.postgres.ssl = true;
        }
    }else{
        console.log("process.env.DATABASE_URL empty");
    }
}

module.exports = {
    hostname: "http://localhost",
    port: 5656,
    database: {
        postgres: developmentDatabase.postgres
    }
}