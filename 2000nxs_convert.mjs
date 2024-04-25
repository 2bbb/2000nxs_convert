import * as fs  from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const listFiles = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(dirent => dirent.isFile() ? [`${dir}/${dirent.name}`] : listFiles(`${dir}/${dirent.name}`)
)

const mkdirpSync = (dir) => {
    if(fs.existsSync(dir)) {
        return;
    }

    const parts = dir.split(path.sep);
    let currentDir = '';

    for(let i = 0; i < parts.length; i++) {
        currentDir += parts[i] + path.sep;
        if(fs.existsSync(currentDir)) continue;

        fs.mkdirSync(currentDir);
        if(i === parts.length - 1) {
            return;
        }
    }
}
  
const args = [ ... process.argv ];
if(/node$/.test(process.argv[0])) {
    console.log(process.argv[0]);
    args.shift();
}

console.log(args);
if(args.length < 2) {
    console.error('no argument given');
    process.exit();
}

const base_dir = args[1];
const contents_dir = path.join(base_dir, 'Contents');
const converted_dir = path.join(base_dir, 'bbb_AutoConverted');

const to_aiff = file => {
    const ext = path.extname(file);
    const dest = file.replace(contents_dir, converted_dir).replace(ext, '.aif');
    return dest;
}

if(!fs.existsSync(contents_dir)) {
    fs.mkdirSync(contents_dir);
}

const filter_DSStore = file => file != '.DS_Store';
const filter_m4a = file => ((path.extname(file) == '.m4a') || (path.extname(file) == '.M4A'));
const filter_flac = file => ((path.extname(file) == '.flac') || (path.extname(file) == '.FLAC'));
const filter_not_converted = file => !fs.existsSync(to_aiff(file));

const files = listFiles(contents_dir)
    .filter(filter_DSStore)
    .filter(f => filter_m4a(f) || filter_flac(f))
    .filter(filter_not_converted);

files.forEach(orig => {
    const dest = to_aiff(file);
    const dest_dir = path.dirname(dest);
    mkdirpSync(dest_dir);
    const cmd = `ffmpeg -i "${orig}" "${dest}"`;
    execSync(cmd);
});