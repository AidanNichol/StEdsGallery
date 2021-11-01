let jetpack = require("fs-jetPack");
let _ = require('lodash')
let { extractFeatures } = require('./extractFeatures')


function findFeatures(walkDir) {
    console.trace('findFeatures')
    console.log('findFeatures cwd', walkDir.cwd())
    let list = walkDir.find('.', { matching: 'features*.json' })
    // list=list.map(f=>/^features.*.json/.test(f));
    let features = []
    console.log('findFeatures list', list)
    for (const fFile of list) {
        let data = walkDir.read(fFile, 'json');
        if (data.wp) {
            data = extractFeatures(data);
            // walkDir.write(data)
        }
        features.push(...data.features)

    }
    features = _.sortBy(features, 'type')
    return features;
}

module.exports = { findFeatures };
