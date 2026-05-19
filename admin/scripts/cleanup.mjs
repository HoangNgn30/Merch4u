import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const D = String.fromCharCode(100, 105, 118);

function toDivTags(s) {
  return s
    .replace(/<motion/g, `<${D}`)
    .replace(/<\/motion>/g, `</${D}>`);
}

const header = path.join(root, "src/Components/Header/index.jsx");
let h = fs.readFileSync(header, "utf8");
h = h.replace(
  /\n          \}\n\n\n\n          <button[\s\S]*?        <\/div>\n\n        <div className="part2/s,
  `\n\n        <${D} className="part2`
);
h = toDivTags(h);
fs.writeFileSync(header, h);

const sidebar = path.join(root, "src/Components/Sidebar/index.jsx");
fs.writeFileSync(sidebar, toDivTags(fs.readFileSync(sidebar, "utf8")));

console.log("cleanup done");
