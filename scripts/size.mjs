import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { transformSync } from "esbuild";

for (const file of ["dist/core/index.js", "dist/react/index.js"]) {
  const min = transformSync(readFileSync(file, "utf8"), { minify: true, loader: "js" }).code;
  console.log(file.padEnd(24), `${(gzipSync(min).length / 1024).toFixed(2)} KB gzip (minified)`);
}
console.log("dist/motion.css".padEnd(24), `${(gzipSync(readFileSync("dist/motion.css")).length / 1024).toFixed(2)} KB gzip`);
