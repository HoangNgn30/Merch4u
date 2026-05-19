import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/Components/Header/index.jsx");
let s = fs.readFileSync(file, "utf8");

const replacement = `        <div className="part1 flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <button
            type="button"
            aria-label="Menu"
            className="w-10 h-10 rounded-full min-w-[40px] shrink-0 hover:bg-[#e2e2e2] flex items-center justify-center border border-[rgba(0,0,0,0.12)]"
            onClick={() => context.setisSidebarOpen(!context.isSidebarOpen)}
          >
            <RiMenu2Line className="text-[20px] text-[rgba(0,0,0,0.85)]" />
          </button>
          <Link to="/" className="shrink-0">
            <img
              src={logoSrc}
              alt="Logo"
              className="h-8 w-auto max-w-[140px] sm:max-w-[180px] object-contain"
              onError={() => setLogoSrc("/icon.svg")}
            />
          </Link>
        </div>`;

const re = /        <div className="part1 flex items-center gap-4">[\s\S]*?        <\/div>/;
if (!re.test(s)) {
  console.error("pattern not found");
  process.exit(1);
}
s = s.replace(re, replacement.replace(/<\/motion>$/, "</div>"));
fs.writeFileSync(file, s);
console.log("ok");
