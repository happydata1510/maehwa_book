-- CreateTable
CREATE TABLE "Book" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Reader" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Reading" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "readDate" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "bookId" INTEGER NOT NULL,
    "readerId" INTEGER,
    CONSTRAINT "Reading_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reading_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "Reader" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Book_title_idx" ON "Book"("title");

-- CreateIndex
CREATE INDEX "Book_author_idx" ON "Book"("author");

-- CreateIndex
CREATE UNIQUE INDEX "Book_title_author_key" ON "Book"("title", "author");

-- CreateIndex
CREATE UNIQUE INDEX "Reader_name_key" ON "Reader"("name");

-- CreateIndex
CREATE INDEX "Reading_readDate_idx" ON "Reading"("readDate");

-- CreateIndex
CREATE INDEX "Reading_bookId_idx" ON "Reading"("bookId");

-- CreateIndex
CREATE INDEX "Reading_readerId_idx" ON "Reading"("readerId");
