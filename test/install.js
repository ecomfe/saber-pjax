var fs  = require('fs');
var child_process = require('child_process');

var URL_PREFIX = 'https://github.com/ecomfe/';
var DIR = 'test/dep';

function getDependencies(path) {
    path = path || '.';
    var file = path + '/package.json';
    if (!fs.existsSync(path)) {
        return {};
    }

    var info = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return info.edp ? info.edp.dependencies : info.dependencies || {};
}

function combineDependencies(indexList, source, target) {
    Object.keys(target).forEach(function (key) {
        if (!source[key]) {
            source[key] = target[key];
            indexList.push(key);
        }
    });
}

var dependencies = getDependencies();
var dependentIndex = Object.keys(dependencies || []);

function install(i) {
    var name = dependentIndex[i];
    if (name === 'fastclick') {
        install(++i);
        return;
    }
    if (!name) {
        console.log('Finish');
        return;
    }
    var version = dependencies[name];

    if (isNaN(parseInt(version.charAt(0), 10))) {
        version = version.substring(1);
    }

    var dist = DIR + '/' + name + '/' + version;

    if (fs.existsSync(dist)) {
        console.log(name + '@' + version + ' is existed');
        install(++i);
    }
    else {
        console.log('Install ' + name + '@' + version + ' ...');
        child_process.exec(
            'git clone ' + URL_PREFIX + name + ' ' + dist,
            function () {
                child_process.exec('cd ' + dist + ';git checkout ' + version, function () {
                    console.log('Install ' + name + '@' + version + ' finish');
                    combineDependencies(dependentIndex, dependencies, getDependencies(dist));
                    install(++i);
                });
            }
        );
    }
}

function checkDir() {
    var dirs = DIR.split('/');
    var path = '.';

    for (var i = 0, name; name = dirs[i]; i++) {
        path += '/' + name;
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    }
}

if (process.argv[2]) {
    DIR = process.argv[2];
}

console.log('Install dependencies to ' + DIR);
checkDir();
install(0);
