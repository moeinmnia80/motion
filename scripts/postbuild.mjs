import { copyFileSync, readFileSync, writeFileSync } from "node:fs";

copyFileSync("src/motion.css", "dist/motion.css");

// bundlers strip module directives: put "use client" back on the React entry
for (const file of ["dist/react/index.js", "dist/react/index.cjs"]) {
  const code = readFileSync(file, "utf8");
  if (!code.startsWith('"use client"')) writeFileSync(file, `"use client";\n${code}`);
}
