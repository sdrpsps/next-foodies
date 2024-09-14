import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { sql } from "@vercel/postgres";
import slugify from "slugify";
import xss from "xss";

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

  const s3Client = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT_URL,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });

  try {
    const key = `${process.env.S3_UPLOAD_KEY}/${filename}`;
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(await meal.image.arrayBuffer()),
      ContentType: meal.image.type,
    });

    await s3Client.send(command);

    meal.image = `${process.env.S3_FILE_PREFIX_URL}/${key}`;
  } catch (error) {
    throw new Error("Failed to upload image");
  }

  await sql`
    INSERT INTO foodies_meals 
      (title, summary, instructions, creator, creator_email, image, slug) 
    VALUES 
      (${meal.title}, ${meal.summary}, ${meal.instructions}, ${meal.creator}, ${meal.creator_email}, ${meal.image}, ${meal.slug})
  `;
}
