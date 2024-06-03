-- CreateTable
CREATE TABLE "_ReceiptToTransaction" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ReceiptToTransaction_AB_unique" ON "_ReceiptToTransaction"("A", "B");

-- CreateIndex
CREATE INDEX "_ReceiptToTransaction_B_index" ON "_ReceiptToTransaction"("B");

-- AddForeignKey
ALTER TABLE "_ReceiptToTransaction" ADD CONSTRAINT "_ReceiptToTransaction_A_fkey" FOREIGN KEY ("A") REFERENCES "Receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReceiptToTransaction" ADD CONSTRAINT "_ReceiptToTransaction_B_fkey" FOREIGN KEY ("B") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
