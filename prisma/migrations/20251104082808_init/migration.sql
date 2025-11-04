-- CreateTable
CREATE TABLE "chains" (
    "id" UUID NOT NULL,
    "chain_id" VARCHAR(100) NOT NULL,
    "blockchain_id" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "explorer_url" VARCHAR(500),
    "native_token_name" VARCHAR(100) NOT NULL,
    "native_token_symbol" VARCHAR(20) NOT NULL,
    "native_token_address" VARCHAR(42),
    "native_token_decimals" INTEGER NOT NULL DEFAULT 18,
    "native_token_logo_url" VARCHAR(500),
    "teleporter_address" VARCHAR(42),
    "teleporter_registry_address" VARCHAR(42),
    "has_icm_enabled" BOOLEAN NOT NULL DEFAULT false,
    "has_in_house_icm" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_testnet" BOOLEAN NOT NULL DEFAULT false,
    "logo_url" VARCHAR(500),
    "website_url" VARCHAR(500),
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chain_rpcs" (
    "id" UUID NOT NULL,
    "chain_id" UUID NOT NULL,
    "rpc_url" VARCHAR(500) NOT NULL,
    "rpc_type" VARCHAR(50) NOT NULL DEFAULT 'http',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "rate_limit_per_second" INTEGER,
    "requires_api_key" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chain_rpcs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" UUID NOT NULL,
    "chain_id" UUID NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 18,
    "token_type" VARCHAR(20) NOT NULL,
    "has_bridge" BOOLEAN NOT NULL DEFAULT false,
    "is_bridgeable" BOOLEAN NOT NULL DEFAULT true,
    "logo_url" VARCHAR(500),
    "total_supply" DECIMAL(78,0),
    "coingecko_id" VARCHAR(100),
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "wallet_address" VARCHAR(42) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployed_contracts" (
    "id" UUID NOT NULL,
    "chain_id" UUID NOT NULL,
    "contract_type" VARCHAR(50) NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "deployer_address" VARCHAR(42),
    "deployment_tx_hash" VARCHAR(66),
    "block_number" BIGINT,
    "gas_used" BIGINT,
    "deployment_params" JSONB,
    "constructor_args" JSONB,
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deployed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deployed_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ictt_setups" (
    "id" UUID NOT NULL,
    "setup_name" VARCHAR(100),
    "token_home_address" VARCHAR(42) NOT NULL,
    "token_home_chain_id" UUID NOT NULL,
    "token_home_token_id" UUID NOT NULL,
    "token_home_contract_id" UUID,
    "token_remote_address" VARCHAR(42) NOT NULL,
    "token_remote_chain_id" UUID NOT NULL,
    "token_remote_token_id" UUID NOT NULL,
    "token_remote_contract_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "setup_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "total_volume" DECIMAL(78,18) NOT NULL DEFAULT 0,
    "total_transactions" INTEGER NOT NULL DEFAULT 0,
    "deployed_by" UUID,
    "deployment_config" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activated_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ictt_setups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_fee_config" (
    "id" UUID NOT NULL,
    "bridge_fee_percentage" DECIMAL(5,4) NOT NULL DEFAULT 0.001,
    "fee_collector_address" VARCHAR(42),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_fee_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_pairs" (
    "id" UUID NOT NULL,
    "source_token_id" UUID NOT NULL,
    "destination_token_id" UUID NOT NULL,
    "ictt_setup_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_direct" BOOLEAN NOT NULL DEFAULT true,
    "available_liquidity" DECIMAL(78,18) NOT NULL DEFAULT 0,
    "locked_liquidity" DECIMAL(78,18) NOT NULL DEFAULT 0,
    "avg_completion_time" INTEGER,
    "success_rate" DECIMAL(5,4),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_pairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bridge_operations" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "user_wallet" VARCHAR(42) NOT NULL,
    "ictt_setup_id" UUID NOT NULL,
    "token_pair_id" UUID,
    "source_chain_id" UUID NOT NULL,
    "source_token_id" UUID NOT NULL,
    "source_amount" DECIMAL(78,18) NOT NULL,
    "source_tx_hash" VARCHAR(66),
    "destination_chain_id" UUID NOT NULL,
    "destination_token_id" UUID NOT NULL,
    "destination_amount" DECIMAL(78,18),
    "destination_address" VARCHAR(42) NOT NULL,
    "destination_tx_hash" VARCHAR(66),
    "bridge_fee" DECIMAL(78,18) NOT NULL DEFAULT 0,
    "bridge_fee_percentage" DECIMAL(5,4),
    "gas_fee" DECIMAL(78,18) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'initiated',
    "failure_reason" TEXT,
    "initiated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),
    "teleporter_message_id" VARCHAR(66),
    "relay_attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bridge_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "chain_id" UUID NOT NULL,
    "tx_hash" VARCHAR(66) NOT NULL,
    "from_address" VARCHAR(42) NOT NULL,
    "to_address" VARCHAR(42),
    "value" DECIMAL(78,18) NOT NULL DEFAULT 0,
    "gas_limit" BIGINT,
    "gas_used" BIGINT,
    "gas_price" DECIMAL(78,0),
    "block_number" BIGINT,
    "block_timestamp" TIMESTAMP(6),
    "status" VARCHAR(20),
    "error_message" TEXT,
    "bridge_operation_id" UUID,
    "contract_deployment_id" UUID,
    "input_data" TEXT,
    "logs" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relayer_status" (
    "id" UUID NOT NULL,
    "relayer_address" VARCHAR(42) NOT NULL,
    "relayer_name" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_heartbeat" TIMESTAMP(6),
    "supported_chains" JSONB,
    "total_relays" INTEGER NOT NULL DEFAULT 0,
    "successful_relays" INTEGER NOT NULL DEFAULT 0,
    "failed_relays" INTEGER NOT NULL DEFAULT 0,
    "avg_relay_time" INTEGER,
    "balance_alerts" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relayer_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chains_chain_id_key" ON "chains"("chain_id");

-- CreateIndex
CREATE UNIQUE INDEX "chains_blockchain_id_key" ON "chains"("blockchain_id");

-- CreateIndex
CREATE INDEX "idx_chains_chain_id" ON "chains"("chain_id");

-- CreateIndex
CREATE INDEX "idx_chains_active" ON "chains"("is_active");

-- CreateIndex
CREATE INDEX "idx_chain_rpcs_chain" ON "chain_rpcs"("chain_id");

-- CreateIndex
CREATE INDEX "idx_chain_rpcs_active" ON "chain_rpcs"("is_active", "priority" DESC);

-- CreateIndex
CREATE INDEX "idx_chain_rpcs_primary" ON "chain_rpcs"("chain_id", "is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "chain_rpcs_chain_id_rpc_url_key" ON "chain_rpcs"("chain_id", "rpc_url");

-- CreateIndex
CREATE INDEX "idx_tokens_chain" ON "tokens"("chain_id");

-- CreateIndex
CREATE INDEX "idx_tokens_symbol" ON "tokens"("symbol");

-- CreateIndex
CREATE INDEX "idx_tokens_bridgeable" ON "tokens"("is_bridgeable");

-- CreateIndex
CREATE INDEX "idx_tokens_address" ON "tokens"("address");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_chain_id_address_key" ON "tokens"("chain_id", "address");

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");

-- CreateIndex
CREATE INDEX "idx_users_wallet" ON "users"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "deployed_contracts_deployment_tx_hash_key" ON "deployed_contracts"("deployment_tx_hash");

-- CreateIndex
CREATE INDEX "idx_contracts_chain" ON "deployed_contracts"("chain_id");

-- CreateIndex
CREATE INDEX "idx_contracts_type" ON "deployed_contracts"("contract_type");

-- CreateIndex
CREATE INDEX "idx_contracts_address" ON "deployed_contracts"("address");

-- CreateIndex
CREATE INDEX "idx_contracts_tx_hash" ON "deployed_contracts"("deployment_tx_hash");

-- CreateIndex
CREATE UNIQUE INDEX "deployed_contracts_chain_id_address_key" ON "deployed_contracts"("chain_id", "address");

-- CreateIndex
CREATE INDEX "idx_ictt_home_chain" ON "ictt_setups"("token_home_chain_id");

-- CreateIndex
CREATE INDEX "idx_ictt_remote_chain" ON "ictt_setups"("token_remote_chain_id");

-- CreateIndex
CREATE INDEX "idx_ictt_status" ON "ictt_setups"("is_active", "setup_status");

-- CreateIndex
CREATE INDEX "idx_ictt_home_token" ON "ictt_setups"("token_home_token_id");

-- CreateIndex
CREATE INDEX "idx_ictt_remote_token" ON "ictt_setups"("token_remote_token_id");

-- CreateIndex
CREATE UNIQUE INDEX "ictt_setups_token_home_chain_id_token_home_address_token_re_key" ON "ictt_setups"("token_home_chain_id", "token_home_address", "token_remote_chain_id", "token_remote_address");

-- CreateIndex
CREATE INDEX "idx_token_pairs_source" ON "token_pairs"("source_token_id");

-- CreateIndex
CREATE INDEX "idx_token_pairs_destination" ON "token_pairs"("destination_token_id");

-- CreateIndex
CREATE INDEX "idx_token_pairs_active" ON "token_pairs"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "token_pairs_source_token_id_destination_token_id_key" ON "token_pairs"("source_token_id", "destination_token_id");

-- CreateIndex
CREATE INDEX "idx_bridge_ops_user" ON "bridge_operations"("user_wallet");

-- CreateIndex
CREATE INDEX "idx_bridge_ops_status" ON "bridge_operations"("status");

-- CreateIndex
CREATE INDEX "idx_bridge_ops_source_tx" ON "bridge_operations"("source_tx_hash");

-- CreateIndex
CREATE INDEX "idx_bridge_ops_dest_tx" ON "bridge_operations"("destination_tx_hash");

-- CreateIndex
CREATE INDEX "idx_bridge_ops_created" ON "bridge_operations"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_bridge_ops_teleporter" ON "bridge_operations"("teleporter_message_id");

-- CreateIndex
CREATE INDEX "idx_bridge_ops_setup" ON "bridge_operations"("ictt_setup_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_tx_hash_key" ON "transactions"("tx_hash");

-- CreateIndex
CREATE INDEX "idx_transactions_hash" ON "transactions"("tx_hash");

-- CreateIndex
CREATE INDEX "idx_transactions_chain" ON "transactions"("chain_id");

-- CreateIndex
CREATE INDEX "idx_transactions_from" ON "transactions"("from_address");

-- CreateIndex
CREATE INDEX "idx_transactions_bridge_op" ON "transactions"("bridge_operation_id");

-- CreateIndex
CREATE INDEX "idx_transactions_status" ON "transactions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "relayer_status_relayer_address_key" ON "relayer_status"("relayer_address");

-- CreateIndex
CREATE INDEX "idx_relayer_active" ON "relayer_status"("is_active");

-- CreateIndex
CREATE INDEX "idx_relayer_address" ON "relayer_status"("relayer_address");

-- AddForeignKey
ALTER TABLE "chain_rpcs" ADD CONSTRAINT "chain_rpcs_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "chains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "chains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployed_contracts" ADD CONSTRAINT "deployed_contracts_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "chains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ictt_setups" ADD CONSTRAINT "ictt_setups_token_home_chain_id_fkey" FOREIGN KEY ("token_home_chain_id") REFERENCES "chains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ictt_setups" ADD CONSTRAINT "ictt_setups_token_remote_chain_id_fkey" FOREIGN KEY ("token_remote_chain_id") REFERENCES "chains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ictt_setups" ADD CONSTRAINT "ictt_setups_token_home_token_id_fkey" FOREIGN KEY ("token_home_token_id") REFERENCES "tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ictt_setups" ADD CONSTRAINT "ictt_setups_token_remote_token_id_fkey" FOREIGN KEY ("token_remote_token_id") REFERENCES "tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ictt_setups" ADD CONSTRAINT "ictt_setups_token_home_contract_id_fkey" FOREIGN KEY ("token_home_contract_id") REFERENCES "deployed_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ictt_setups" ADD CONSTRAINT "ictt_setups_token_remote_contract_id_fkey" FOREIGN KEY ("token_remote_contract_id") REFERENCES "deployed_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ictt_setups" ADD CONSTRAINT "ictt_setups_deployed_by_fkey" FOREIGN KEY ("deployed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_pairs" ADD CONSTRAINT "token_pairs_source_token_id_fkey" FOREIGN KEY ("source_token_id") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_pairs" ADD CONSTRAINT "token_pairs_destination_token_id_fkey" FOREIGN KEY ("destination_token_id") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_pairs" ADD CONSTRAINT "token_pairs_ictt_setup_id_fkey" FOREIGN KEY ("ictt_setup_id") REFERENCES "ictt_setups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_operations" ADD CONSTRAINT "bridge_operations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_operations" ADD CONSTRAINT "bridge_operations_ictt_setup_id_fkey" FOREIGN KEY ("ictt_setup_id") REFERENCES "ictt_setups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_operations" ADD CONSTRAINT "bridge_operations_token_pair_id_fkey" FOREIGN KEY ("token_pair_id") REFERENCES "token_pairs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_operations" ADD CONSTRAINT "bridge_operations_source_chain_id_fkey" FOREIGN KEY ("source_chain_id") REFERENCES "chains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_operations" ADD CONSTRAINT "bridge_operations_destination_chain_id_fkey" FOREIGN KEY ("destination_chain_id") REFERENCES "chains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_operations" ADD CONSTRAINT "bridge_operations_source_token_id_fkey" FOREIGN KEY ("source_token_id") REFERENCES "tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_operations" ADD CONSTRAINT "bridge_operations_destination_token_id_fkey" FOREIGN KEY ("destination_token_id") REFERENCES "tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "chains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bridge_operation_id_fkey" FOREIGN KEY ("bridge_operation_id") REFERENCES "bridge_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_contract_deployment_id_fkey" FOREIGN KEY ("contract_deployment_id") REFERENCES "deployed_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
