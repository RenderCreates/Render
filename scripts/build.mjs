import {cp, mkdir, readdir, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = path.join(root, 'dist');
// Only regenerate the known build directory within this project.
if(path.dirname(output)!==root || path.basename(output)!=='dist') throw new Error('Invalid output directory');
await rm(output, {recursive:true, force:true});
await mkdir(output, {recursive:true});
for (const file of await readdir(root, {withFileTypes:true})) {
  if (['assets','admin'].includes(file.name) || (file.isFile() && /\.(html|css|js)$/.test(file.name))) {
    await cp(path.join(root,file.name),path.join(output,file.name),{recursive:true});
  }
}
console.log('Built public website and admin UI. Server source and secrets excluded.');
