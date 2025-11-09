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

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Không có tệp nào được tải lên." },
        { status: 400 }
      );
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "assets",
      "images",
      "products"
    );
    await fs.mkdir(uploadDir, { recursive: true });

    const savedPaths: string[] = [];

    for (const entry of files) {
      if (!(entry instanceof File)) {
        continue;
      }

      if (entry.size === 0) {
        continue;
      }

      if (entry.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: `Ảnh ${entry.name} vượt quá dung lượng tối đa ${MAX_FILE_SIZE_MB}MB.`,
          },
          { status: 400 }
        );
      }

      if (!ACCEPTED_IMAGE_MIME_TYPES.has(entry.type)) {
        return NextResponse.json(
          {
            error: "Chỉ hỗ trợ tải lên ảnh JPG, PNG hoặc WEBP.",
          },
          { status: 400 }
        );
      }

      const extension =
        MIME_TYPE_EXTENSION_MAP[entry.type] ||
        path.extname(entry.name).toLowerCase() ||
        ".jpg";

      const safeBaseName =
        path
          .parse(entry.name)
          .name.replace(/[^a-z0-9-_]/gi, "")
          .toLowerCase() || "product";

      const filename = `${safeBaseName}-${randomUUID()}${extension}`;
      const filePath = path.join(uploadDir, filename);

      const arrayBuffer = await entry.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(filePath, buffer);

      savedPaths.push(`/assets/images/products/${filename}`);
    }

    if (savedPaths.length === 0) {
      return NextResponse.json(
        { error: "Không có ảnh hợp lệ nào được lưu." },
        { status: 400 }
      );
    }

    return NextResponse.json({ paths: savedPaths }, { status: 201 });
  } catch (error) {
    console.error("[UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tải ảnh lên máy chủ." },
      { status: 500 }
    );
  }
}
