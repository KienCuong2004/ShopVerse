"use server";

import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import path from "path";

const CATEGORIES_IMAGE_DIR = path.join(
  process.cwd(),
  "public",
  "assets",
  "images",
  "categories"
);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const createLabelFromFilename = (filename: string) => {
  const basename = filename.replace(/\.[^/.]+$/, "");
  return basename
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export async function GET() {
  try {
    const entries = await readdir(CATEGORIES_IMAGE_DIR, {
      withFileTypes: true,
    });

    const images = entries
      .filter(
        (entry) =>
          entry.isFile() &&
          !entry.name.startsWith(".") &&
          ALLOWED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
      )
      .map((entry) => {
        const url = `/assets/images/categories/${entry.name}`;
        return {
          value: url,
          label: createLabelFromFilename(entry.name),
          filename: entry.name,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Failed to list category images", error);
    return NextResponse.json(
      { message: "Không thể tải danh sách ảnh danh mục" },
      { status: 500 }
    );
  }
}
