
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
    
    process.env.DATABASE_URL = "postgres://obbbtqihcvqgal:899f000423d429d89b05034f05cf195a96d5d010320368b51c35e4ce55a11b15@ec2-54-217-243-160.eu-west-1.compute.amazonaws.com:5432/d6kmo2qrui9du3"

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
    }
}

module.exports = {
    hostname: "http://localhost",
    port: 5656,
    database: {
        postgres: developmentDatabase.postgres
    }
}