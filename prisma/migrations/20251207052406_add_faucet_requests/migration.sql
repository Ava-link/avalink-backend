-- CreateTable
CREATE TABLE "faucet_requests" (
    "id" UUID NOT NULL,
    "wallet_address" VARCHAR(42) NOT NULL,
    "token_address" VARCHAR(42) NOT NULL,
    "amount" DECIMAL(78,18) NOT NULL,
    "tx_hash" VARCHAR(66),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faucet_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_faucet_requests_wallet_time" ON "faucet_requests"("wallet_address", "created_at");

-- CreateIndex
CREATE INDEX "idx_faucet_requests_token" ON "faucet_requests"("token_address");
