import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/App.jsx");
let s = fs.readFileSync(file, "utf8");

if (!s.includes('import AdminShell')) {
  s = s.replace(
    'import Header from "./Components/Header";\nimport Sidebar from "./Components/Sidebar";',
    'import AdminShell from "./components/AdminShell";'
  );
}

const openRe =
  /          <section className="main">\r?\n            <Header \/>\r?\n            <div className="contentMain flex">\r?\n              <motion[\s\S]*?<Sidebar \/>\s*<\/motion>\s*<div[\s\S]*?>\r?\n/g;
const openReFixed = new RegExp(openRe.source.replace(/motion/g, "div"), "g");

const closeRe = new RegExp(
  /              <\/div>\r?\n            <\/div>\r?\n          <\/section>/.source,
  "g"
);

let openCount = 0;
s = s.replace(openReFixed, () => {
  openCount++;
  return "          <AdminShell>\n";
});

let closeCount = 0;
s = s.replace(closeRe, () => {
  closeCount++;
  return "          </AdminShell>";
});

console.log({ openCount, closeCount });
if (openCount !== closeCount) {
  console.error("Mismatch - aborting write");
  process.exit(1);
}
fs.writeFileSync(file, s);
