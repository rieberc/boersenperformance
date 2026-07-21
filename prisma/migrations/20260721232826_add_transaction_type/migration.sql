-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL');

-- RenameColumn (preserves existing data)
ALTER TABLE "Holding" RENAME COLUMN "buyPrice" TO "price";
ALTER TABLE "Holding" RENAME COLUMN "buyDate" TO "date";

-- AddColumn
ALTER TABLE "Holding" ADD COLUMN "type" "TransactionType" NOT NULL DEFAULT 'BUY';

-- CreateIndex
CREATE INDEX "Holding_userId_symbol_idx" ON "Holding"("userId", "symbol");
