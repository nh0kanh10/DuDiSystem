import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import {
  S3_BUCKET,
  S3_ENDPOINT,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_REGION,
} from "../config/index.js"

export const provider = "s3"

let client = null

function assertConfigured() {
  if (!S3_BUCKET || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
    throw new Error(
      "FILE_STORAGE_PROVIDER=s3 nhưng thiếu S3_BUCKET / S3_ACCESS_KEY / S3_SECRET_KEY. "
      + "Dev: dùng FILE_STORAGE_PROVIDER=local",
    )
  }
  if (!S3_ENDPOINT) {
    throw new Error(
      "FILE_STORAGE_PROVIDER=s3 cần S3_ENDPOINT "
      + "(R2: https://<ACCOUNT_ID>.r2.cloudflarestorage.com)",
    )
  }
}

function getClient() {
  assertConfigured()
  if (!client) {
    client = new S3Client({
      region: S3_REGION || "auto",
      endpoint: S3_ENDPOINT,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      },
    })
  }
  return client
}

async function bodyToBuffer(body) {
  if (!body) return null
  if (Buffer.isBuffer(body)) return body
  if (body instanceof Uint8Array) return Buffer.from(body)
  const chunks = []
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export async function put(key, buffer, options = {}) {
  const s3 = getClient()
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: options.contentType || "application/octet-stream",
  }))
  return { key, provider }
}

export async function get(key) {
  const s3 = getClient()
  try {
    const res = await s3.send(new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }))
    return bodyToBuffer(res.Body)
  } catch (err) {
    if (err?.name === "NoSuchKey" || err?.$metadata?.httpStatusCode === 404) {
      return null
    }
    throw err
  }
}

export async function remove(key) {
  const s3 = getClient()
  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }))
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404) return
    throw err
  }
}
