-- Initial PostgreSQL schema for Vercel deployments.

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "emailEncrypted" TEXT NOT NULL,
  "emailHash" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "nameEncrypted" TEXT,
  "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  "twoFactorSecretEncrypted" TEXT,
  "passwordResetTokenHash" TEXT,
  "passwordResetExpiresAt" TIMESTAMP(3),
  "consentAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "garments" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "colorHex" TEXT NOT NULL,
  "style" TEXT NOT NULL,
  "occasions" TEXT NOT NULL,
  "season" TEXT NOT NULL,
  "material" TEXT,
  "confidence" DOUBLE PRECISION,
  "length" TEXT,
  "fit" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "garments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "looks" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "garmentsJson" TEXT NOT NULL,
  "moodTags" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "eventContext" TEXT NOT NULL,
  "saved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "looks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_files" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "knowledge_files_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_index" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "indexJson" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "knowledge_index_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_emailEncrypted_key" ON "users"("emailEncrypted");
CREATE UNIQUE INDEX "users_emailHash_key" ON "users"("emailHash");
CREATE UNIQUE INDEX "knowledge_files_userId_filename_key" ON "knowledge_files"("userId", "filename");
CREATE UNIQUE INDEX "knowledge_index_userId_key" ON "knowledge_index"("userId");

ALTER TABLE "garments"
  ADD CONSTRAINT "garments_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "looks"
  ADD CONSTRAINT "looks_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "knowledge_files"
  ADD CONSTRAINT "knowledge_files_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "knowledge_index"
  ADD CONSTRAINT "knowledge_index_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
