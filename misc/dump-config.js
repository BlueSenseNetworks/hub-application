var config = require('config');

function dump(key) {
    console.log(key + ' => ' + config.get(key));
}

dump('PlatformConnectionUrl');
dump('HubName');
