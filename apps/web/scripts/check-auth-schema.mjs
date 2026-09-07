import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getAuthTables } from "better-auth/db";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(HERE, "..", "prisma", "schema.prisma");

/** Better Auth's field types, in Prisma's vocabulary. */
const PRISMA_TYPE = {
    string: "String",
    boolean: "Boolean",
    date: "DateTime",
    number: "Int",
    bigint: "BigInt",
};

/* ------------------------------------------------------------ schema parsing */

const stripComment = (line) => line.replace(/\/\/.*$/, "").trim();

/**
 * Parse one `model` block into the shape this check compares against: scalar fields
 * only, plus the block-level attributes. Relation fields (a list, or anything carrying
 * `@relation`) are not columns and are deliberately dropped.
 */
const parseModel = (body) => {
    const fields = new Map();
    const blockAttributes = [];

    for (const raw of body.split("\n")) {
        const line = stripComment(raw);
        if (line === "") continue;

        if (line.startsWith("@@")) {
            blockAttributes.push(line);
            continue;
        }

        const match = /^(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)$/.exec(line);
        if (!match) continue;

        const [, name, type, list, optional, attributes] = match;
        if (list !== undefined) continue;
        if (attributes.includes("@relation")) continue;

        fields.set(name, {
            type,
            optional: optional !== undefined,
            unique: /@unique\b/.test(attributes),
            id: /@id\b/.test(attributes),
            attributes,
        });
    }

    return { fields, blockAttributes };
};

const parseSchema = (source) => {
    const models = new Map();
    const blocks = source.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm);

    for (const [, name, body] of blocks) {
        const model = parseModel(body);
        const mapped = /@@map\("([^"]+)"\)/.exec(model.blockAttributes.join("\n"));
        models.set(mapped ? mapped[1] : name, { name, body, ...model });
    }

    return models;
};

/* -------------------------------------------------------------------- checks */

const problems = [];
const fail = (message) => problems.push(message);

const models = parseSchema(readFileSync(SCHEMA_PATH, "utf8"));
const tables = getAuthTables({});
let checkedFields = 0;

for (const [key, table] of Object.entries(tables)) {
    const tableName = table.modelName;
    const model = models.get(tableName);

    if (!model) {
        fail(
            `table "${tableName}" (Better Auth's \`${key}\`) has no Prisma model mapped to it`,
        );
        continue;
    }

    const id = model.fields.get("id");
    if (!id?.id) {
        fail(`${model.name}: no \`id\` field marked @id`);
    } else if (id.type !== "String") {
        fail(
            `${model.name}.id is ${id.type}; Better Auth generates string ids, so it must be String`,
        );
    }

    for (const [name, spec] of Object.entries(table.fields)) {
        const columnName = spec.fieldName ?? name;
        const field = model.fields.get(columnName);
        checkedFields += 1;

        if (!field) {
            fail(`${model.name}: missing field \`${columnName}\``);
            continue;
        }

        const expectedType = spec.bigint ? PRISMA_TYPE.bigint : PRISMA_TYPE[spec.type];

        if (expectedType !== undefined && field.type !== expectedType) {
            fail(
                `${model.name}.${columnName} is ${field.type}; Better Auth declares ${spec.type}, so it must be ${expectedType}`,
            );
        }

        const shouldBeOptional = spec.required !== true;
        if (field.optional !== shouldBeOptional) {
            fail(
                `${model.name}.${columnName} is ${field.optional ? "optional" : "required"}; ` +
                    `Better Auth declares it ${shouldBeOptional ? "optional" : "required"}`,
            );
        }

        if (spec.unique === true && !field.unique) {
            fail(`${model.name}.${columnName} must carry @unique`);
        }

        if (spec.references !== undefined) {
            const relation = new RegExp(`@relation\\(fields:\\s*\\[${columnName}\\]`);
            if (!relation.test(model.body)) {
                fail(
                    `${model.name}.${columnName} references ${spec.references.model}.${spec.references.field} ` +
                        `but no relation field is declared on [${columnName}]`,
                );
            }
            if (
                spec.references.onDelete === "cascade" &&
                !/onDelete:\s*Cascade/.test(model.body)
            ) {
                fail(
                    `${model.name}.${columnName} must cascade on delete, per Better Auth`,
                );
            }
        }

        if (spec.index === true) {
            const indexed = model.blockAttributes.some((attribute) =>
                new RegExp(`@@(index|unique)\\(\\[${columnName}[,\\]]`).test(attribute),
            );
            if (!indexed && !field.unique) {
                fail(
                    `${model.name}.${columnName} is declared indexed by Better Auth but has no @@index`,
                );
            }
        }
    }

    const declared = new Set(
        Object.entries(table.fields).map(([name, spec]) => spec.fieldName ?? name),
    );

    for (const name of model.fields.keys()) {
        if (name === "id" || declared.has(name)) continue;
        fail(
            `${model.name}.${name} is not part of Better Auth's schema; an undeclared column ` +
                `on an auth table will not be written, and a required one breaks every insert`,
        );
    }
}

/* -------------------------------------------------------------------- report */

const tableCount = Object.keys(tables).length;
console.log(
    `\n  Better Auth tables: ${Object.values(tables)
        .map((table) => table.modelName)
        .join(", ")}`,
);
console.log(`  Schema: ${SCHEMA_PATH}\n`);

if (problems.length > 0) {
    console.error(
        `  ✗ ${problems.length} mismatch(es) between prisma/schema.prisma and the installed Better Auth:\n`,
    );
    for (const problem of problems) console.error(`    - ${problem}`);
    console.error(
        `\n  Fix the schema, then run \`pnpm db:generate\` and create a migration.\n`,
    );
    process.exit(1);
}

console.log(
    `  ✓ ${tableCount} auth tables, ${checkedFields} fields, all matching the installed Better Auth.\n`,
);
