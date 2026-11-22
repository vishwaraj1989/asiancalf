const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const readline = require('node:readline/promises');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { planCategoryMigration } = require('../services/categoryMigration');

function databaseTarget(uri) {
  let parsed;
  try { parsed = new URL(uri); } catch { throw new Error('MONGO_URI is not a valid MongoDB URI.'); }
  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
  if (!database) throw new Error('MONGO_URI must include the intended database name.');
  return { host: parsed.hostname, database };
}

function isNonProductionDatabase(database) {
  return /(?:^|[_-])(dev(?:elopment)?|local|staging|test(?:ing)?)(?:$|[_-])/i.test(database);
}

async function confirmApply(target, counts) {
  if (process.env.NODE_ENV === 'production') throw new Error('Apply is disabled when NODE_ENV=production.');
  if (!isNonProductionDatabase(target.database)) {
    throw new Error('Apply is restricted to database names ending in or containing _dev, _local, _staging, or _test.');
  }
  if (!process.stdin.isTTY) throw new Error('Apply requires an interactive terminal confirmation.');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const expected = `APPLY ${counts.safelyMatched} CATEGORY LINKS TO NON-PRODUCTION DATABASE ${target.database}`;
    console.log(`Target host: ${target.host}`);
    console.log(`Target database: ${target.database}`);
    console.log(`Only the category field of ${counts.safelyMatched} matched products can be updated.`);
    const answer = await rl.question(`Type exactly “${expected}” to continue: `);
    if (answer !== expected) throw new Error('Confirmation did not match; no products were changed.');
  } finally {
    rl.close();
  }
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (process.argv.some((arg) => arg.startsWith('--confirm'))) {
    throw new Error('Confirmation is interactive only; no command-line confirmation can bypass the prompt.');
  }
  const target = databaseTarget(process.env.MONGO_URI || '');
  if (apply && process.env.NODE_ENV === 'production') {
    throw new Error('Apply is disabled when NODE_ENV=production.');
  }
  if (apply && !isNonProductionDatabase(target.database)) {
    throw new Error('Apply is restricted to database names containing a _dev, _local, _staging, or _test suffix.');
  }
  await connectDB();

  const [products, categories] = await Promise.all([
    Product.collection.find({}).toArray(),
    Category.collection.find({}).toArray(),
  ]);
  const plan = planCategoryMigration(products, categories);
  console.log(`CATEGORY MIGRATION PREVIEW (read-only${apply ? '; apply requested' : ''})`);
  console.log(JSON.stringify({ target: { host: target.host, database: target.database }, summary: {
    inspected: plan.inspected,
    correctlyCategorized: plan.correctlyCategorized,
    safelyMatched: plan.safelyMatched,
    manuallyAssignable: plan.manuallyAssignable,
  }, safeMatches: plan.safeMatches.map(({ previousCategoryId, previousCategoryValue, productMongoId, ...row }) => row), unmatched: plan.unmatched }, null, 2));

  if (!apply) return;
  await confirmApply(target, plan);
  let updated = 0;
  let skipped = 0;
  for (const row of plan.safeMatches) {
    const result = await Product.collection.updateOne(
      { _id: row.productMongoId, category: row.previousCategoryValue },
      { $set: { category: new mongoose.Types.ObjectId(row.proposedCategory.id) } }
    );
    if (result.modifiedCount === 1) updated += 1;
    else skipped += 1;
  }
  console.log(JSON.stringify({ applied: true, updated, skipped, unmatched: plan.manuallyAssignable }, null, 2));
}

main()
  .catch((error) => {
    console.error(`Product category migration stopped: ${error.name || 'Error'}: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => { await mongoose.disconnect(); });
