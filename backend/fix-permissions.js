const fs = require('fs');
const path = require('path');

function removeDir(dir) {
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach((file, index) => {
            const curPath = path.join(dir, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                removeDir(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(dir);
    }
}
try {
    removeDir(path.join(__dirname, 'node_modules'));
    console.log('Successfully cleared node_modules');
} catch (e) {
    console.error('Failed to clear node_modules:', e);
}
