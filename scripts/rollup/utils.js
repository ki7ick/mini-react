import path from "path";
import fs from "fs";

import ts from "rollup-plugin-typescript2";
import cjs from "@rollup/plugin-alias";
import replace from "@rollup/plugin-replace";

const pkgPath = path.resolve(__dirname, "../../packages");
const distPath = path.resolve(__dirname, "../../dist/node_modules");

export function resolvePkgPath(pkgName, isDist) {
  return `${isDist ? distPath : pkgPath}/${pkgName}`;
}

export function getPackageJson(pkgName) {
  return JSON.parse(
    fs.readFileSync(`${resolvePkgPath(pkgName)}/package.json`, {
      encoding: "utf-8"
    })
  );
}

export function getBaseRollupPlugins({
  alias = {
    __DEV__: true
  },
  typescript = {}
} = {}) {
  return [replace(alias), cjs(), ts(typescript)];
}
