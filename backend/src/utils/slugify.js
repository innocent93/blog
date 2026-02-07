const slugify = require('slugify');

async function generateSlug(Model, title) {
  const base = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
  let slug = base;
  let count = 0;
  while (await Model.exists({ slug })) {
    count += 1;
    slug = `${base}-${count}`;
  }
  return slug;
}

module.exports = { generateSlug };
