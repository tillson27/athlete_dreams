-- CreateTable
CREATE TABLE "signup_allowlist_entries" (
    "id" UUID NOT NULL,
    "entry" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signup_allowlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "signup_allowlist_entries_entry_key" ON "signup_allowlist_entries"("entry");
