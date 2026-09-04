import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(projectRoot, "public");
const errors = [];
let validatedPaths = 0;

function unwrap(expression) {
  if (ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression) || ts.isParenthesizedExpression(expression)) {
    return unwrap(expression.expression);
  }
  return expression;
}

async function readDataArray(relativeFile, variableName) {
  const filePath = path.join(projectRoot, relativeFile);
  const sourceText = await readFile(filePath, "utf8");
  const source = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let array;

  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === variableName && node.initializer) {
      const initializer = unwrap(node.initializer);
      if (ts.isArrayLiteralExpression(initializer)) array = initializer;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!array) throw new Error(`Could not find ${variableName} array in ${relativeFile}`);
  return { array, relativeFile };
}

function objectStringValue(object, propertyName) {
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const name = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
      ? property.name.text
      : undefined;
    if (name !== propertyName) continue;
    const value = unwrap(property.initializer);
    return ts.isStringLiteralLike(value) ? value.text : undefined;
  }
  return undefined;
}

async function validatePublicPath(label, publicPath) {
  if (!publicPath) return;
  validatedPaths += 1;
  if (publicPath.startsWith("/")) {
    errors.push(`${label}: "${publicPath}" is root-absolute; store a public-relative path so Vite BASE_URL can be applied.`);
    return;
  }
  if (publicPath.includes("\\")) {
    errors.push(`${label}: "${publicPath}" must use URL-style forward slashes.`);
    return;
  }

  const segments = publicPath.split("/").filter(Boolean);
  if (segments.length === 0 || segments.some((segment) => segment === "." || segment === "..")) {
    errors.push(`${label}: "${publicPath}" is not a safe public-directory path.`);
    return;
  }

  let currentDirectory = publicRoot;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    let entries;
    try {
      entries = await readdir(currentDirectory);
    } catch {
      errors.push(`${label}: parent directory does not exist for "${publicPath}".`);
      return;
    }

    if (!entries.includes(segment)) {
      const caseInsensitiveMatch = entries.find((entry) => entry.toLowerCase() === segment.toLowerCase());
      if (caseInsensitiveMatch) {
        errors.push(`${label}: capitalization mismatch in "${publicPath}"; disk contains "${caseInsensitiveMatch}".`);
      } else {
        errors.push(`${label}: file does not exist: public/${publicPath}`);
      }
      return;
    }
    currentDirectory = path.join(currentDirectory, segment);
  }

  try {
    const file = await stat(currentDirectory);
    if (!file.isFile()) errors.push(`${label}: expected a file at public/${publicPath}`);
    else if (file.size === 0) errors.push(`${label}: file is empty: public/${publicPath}`);
  } catch {
    errors.push(`${label}: file does not exist: public/${publicPath}`);
  }
}

const memories = await readDataArray("src/data/memories.ts", "MEMORIES");
for (const [index, element] of memories.array.elements.entries()) {
  const object = unwrap(element);
  if (!ts.isObjectLiteralExpression(object)) {
    errors.push(`MEMORIES[${index}] is not an object literal.`);
    continue;
  }
  const id = objectStringValue(object, "id") ?? `index ${index}`;
  for (const field of ["src", "thumbnailSrc"]) {
    const value = objectStringValue(object, field);
    if (value === undefined) errors.push(`${id}.${field}: missing string path in ${memories.relativeFile}.`);
    else await validatePublicPath(`${id}.${field}`, value);
  }
}

const story = await readDataArray("src/data/story.ts", "STORY_CHAPTERS");
for (const [index, element] of story.array.elements.entries()) {
  const object = unwrap(element);
  if (!ts.isObjectLiteralExpression(object)) continue;
  const image = objectStringValue(object, "image");
  if (image) {
    const id = objectStringValue(object, "id") ?? `index ${index}`;
    await validatePublicPath(`${id}.image`, image);
  }
}

if (errors.length > 0) {
  console.error(`Image path validation failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Image path validation passed (${validatedPaths} public image paths checked).`);
}
