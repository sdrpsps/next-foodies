import { sql } from '@vercel/postgres';
import slugify from "slugify";
import xss from "xss";
import fs from "fs";

export async function getMeals() {
  const { rows } = await sql`SELECT * FROM foodies_meals`;
  return rows;
}

export async function getMeal(slug) {
  const { rows } = await sql`SELECT * FROM foodies_meals WHERE slug = ${slug}`;
  return rows[0];
}

export async function saveMeal(meal) {
  meal.slug = slugify(meal.title, { lower: true });
  meal.instructions = xss(meal.instructions);

  const extension = meal.image.name.split(".").pop();
  const filename = `${meal.slug}.${extension}`;

  const stream = fs.createWriteStream(`public/images/${filename}`);
  const bufferedImage = await meal.image.arrayBuffer();

  stream.write(Buffer.from(bufferedImage), (error) => {
    if (error) {
      throw new Error("Failed to save image");
    }
  });

  meal.image = `/images/${filename}`;

  await sql`
    INSERT INTO foodies_meals 
      (title, summary, instructions, creator, creator_email, image, slug) 
    VALUES 
      (${meal.title}, ${meal.summary}, ${meal.instructions}, ${meal.creator}, ${meal.creator_email}, ${meal.image}, ${meal.slug})
  `;
}
