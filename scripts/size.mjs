import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

for (const f of ["dist/core/index.js", "dist/react/index.js", "dist/motion.css"]) {
  const buf = readFileSync(f);
  console.log(f.padEnd(24), `${buf.length} B`.padStart(9), `| gzip ${gzipSync(buf).length} B`);
}
