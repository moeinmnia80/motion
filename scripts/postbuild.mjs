import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

// 1) CSS
mkdirSync("dist", { recursive: true });
copyFileSync("src/styles/motion.css", "dist/motion.css");

// 2) tsup/rollup strips module-level directives, so re-add "use client"
//    to the React entry (Next.js needs it as the very first statement)
for (const file of ["dist/react/index.js", "dist/react/index.cjs"]) {
  const code = readFileSync(file, "utf8");
  if (!code.startsWith('"use client"')) {
    writeFileSync(file, `"use client";\n${code}`);
  }
}
console.log("postbuild done");
