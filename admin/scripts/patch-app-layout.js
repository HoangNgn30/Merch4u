import fs from "fs";

const p = new URL("../src/App.jsx", import.meta.url);
const file = fs.fileURLToPath(p);
let s = fs.readFileSync(file, "utf8");

const openRe =
  /          <section className="main">\s*<Header \/>\s*<div className="contentMain flex">\s*<div\s*className=\{`overflow-hidden sidebarWrapper[\s\S]*?>\s*<Sidebar \/>\s*\s*<\/motion>\s*<div\s*className=\{`contentRight overflow-hidden[\s\S]*?>\s*/g;

// Fix typo - the file uses </motion> incorrectly? Let me read actual pattern
const openRe2 =
  /          <section className="main">\r?\n            <Header \/>\r?\n            <motion className="contentMain flex">\r?\n              <div[\s\S]*?<Sidebar \/>\r?\n\r?\n              <\/div>\r?\n              <div[\s\S]*?>\r?\n/g;

let n = 0;
s = s.replace(
  /          <section className="main">[\s\S]*?<Sidebar \/>\s*<\/div>\s*<div[^>]*contentRight[^>]*>\s*/g,
  () => {
    n++;
    return "          <AdminShell>\n";
  }
);

s = s.replace(
  /              <\/div>\s*<\/motion>\s*<\/motion>\s*<\/section>/g,
  "          </AdminShell>"
);

// fallback closing
s = s.replace(
  /              <\/motion>\s*<\/motion>\s*<\/motion>\s*<\/section>/g,
  "          </AdminShell>"
);

s = s.replace(
  /              <\/div>\s*<\/div>\s*<\/section>/g,
  "          </AdminShell>"
);

console.log("Replaced openings:", n);
fs.writeFileSync(file, s);
