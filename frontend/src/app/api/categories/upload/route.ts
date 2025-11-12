"use server";

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const ACCEPTED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MIME_TYPE_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const entries = formData.getAll("files");

    const candidate =
      entries.find((entry): entry is File => entry instanceof File) ??
      (formData.get("file") instanceof File
        ? (formData.get("file") as File)
        : null);

    if (!candidate) {
      return NextResponse.json(
        { error: "Không có ảnh hợp lệ được chọn." },
        { status: 400 }
      );
    }

    if (candidate.size === 0) {
      return NextResponse.json(
        { error: "Ảnh tải lên bị rỗng. Vui lòng thử lại." },
        { status: 400 }
      );
    }

    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Ảnh ${candidate.name} vượt quá dung lượng tối đa ${MAX_FILE_SIZE_MB}MB.`,
        },
        { status: 400 }
      );
    }

    if (!ACCEPTED_IMAGE_MIME_TYPES.has(candidate.type)) {
      return NextResponse.json(
        { error: "Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP." },
        { status: 400 }
      );
    }

    const extension =
      MIME_TYPE_EXTENSION_MAP[candidate.type] ||
      path.extname(candidate.name).toLowerCase() ||
      ".jpg";

    const safeBaseName =
      path
        .parse(candidate.name)
        .name.replace(/[^a-z0-9-_]/gi, "")
        .toLowerCase() || "category";

    const filename = `${safeBaseName}-${randomUUID()}${extension}`;

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "assets",
      "images",
      "categories"
    );
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    const arrayBuffer = await candidate.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    const relativePath = `/assets/images/categories/${filename}`;

    return NextResponse.json({ path: relativePath }, { status: 201 });
  } catch (error) {
    console.error("[CATEGORY_IMAGE_UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tải ảnh danh mục lên." },
      { status: 500 }
    );
  }
}
