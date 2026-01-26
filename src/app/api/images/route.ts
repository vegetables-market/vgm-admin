import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3Client, bucketName, publicUrl } from "@/lib/s3";

export async function GET() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "uploads/",
    });

    const response = await s3Client.send(command);

    const images = (response.Contents || [])
      .filter((obj) => obj.Key && obj.Key !== "uploads/")
      .map((obj) => ({
        key: obj.Key!,
        url: `${publicUrl}/${obj.Key}`,
        size: obj.Size,
        lastModified: obj.LastModified?.toISOString(),
      }))
      .sort((a, b) => {
        if (!a.lastModified || !b.lastModified) return 0;
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      });

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error listing images:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to list images", details: errorMessage },
      { status: 500 }
    );
  }
}
