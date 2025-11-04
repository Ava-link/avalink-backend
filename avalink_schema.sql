-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CHAINS TABLE
CREATE TABLE chains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_id VARCHAR(100) UNIQUE NOT NULL, -- Avalanche chain ID
    blockchain_id VARCHAR(100) UNIQUE NOT NULL, -- Hex blockchain ID
    name VARCHAR(100) NOT NULL,
    explorer_url VARCHAR(500),
    
    -- Native Token Info
    native_token_name VARCHAR(100) NOT NULL,
    native_token_symbol VARCHAR(20) NOT NULL,
    native_token_address VARCHAR(42), -- Contract address if wrapped, null for pure native
    native_token_decimals INTEGER DEFAULT 18,
    native_token_logo_url VARCHAR(500),
    
    -- ICTT Configuration
    teleporter_address VARCHAR(42),
    teleporter_registry_address VARCHAR(42),
    has_icm_enabled BOOLEAN DEFAULT FALSE,
    has_in_house_icm BOOLEAN DEFAULT FALSE,
    
    -- Chain Status
    is_active BOOLEAN DEFAULT TRUE,
    is_testnet BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chains_chain_id ON chains(chain_id);
CREATE INDEX idx_chains_active ON chains(is_active);


-- 2. CHAIN_RPCS TABLE (Multiple RPCs per chain)
CREATE TABLE chain_rpcs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
    
    rpc_url VARCHAR(500) NOT NULL,
    rpc_type VARCHAR(50) DEFAULT 'http', -- 'http', 'websocket', 'ipc'
    
    -- Priority & Status
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0, -- Higher priority used first
    is_primary BOOLEAN DEFAULT FALSE, -- Primary RPC for the chain
    
    -- Rate Limiting
    rate_limit_per_second INTEGER,
    requires_api_key BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(chain_id, rpc_url)
);

CREATE INDEX idx_chain_rpcs_chain ON chain_rpcs(chain_id);
CREATE INDEX idx_chain_rpcs_active ON chain_rpcs(is_active, priority DESC);
CREATE INDEX idx_chain_rpcs_primary ON chain_rpcs(chain_id, is_primary) WHERE is_primary = TRUE;


-- 3. TOKENS TABLE
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
    
    address VARCHAR(42) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    decimals INTEGER NOT NULL DEFAULT 18,
    token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('native', 'erc20', 'wrapped')),
    
    -- Bridge Status
    has_bridge BOOLEAN DEFAULT FALSE,
    is_bridgeable BOOLEAN DEFAULT TRUE,
    
    -- Token Info
    logo_url VARCHAR(500),
    total_supply NUMERIC(78, 0),
    coingecko_id VARCHAR(100),
    
    -- Metadata
    description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(chain_id, address)
);

CREATE INDEX idx_tokens_chain ON tokens(chain_id);
CREATE INDEX idx_tokens_symbol ON tokens(symbol);
CREATE INDEX idx_tokens_bridgeable ON tokens(is_bridgeable);
CREATE INDEX idx_tokens_address ON tokens(address);


-- 4. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_wallet ON users(wallet_address);


-- 5. DEPLOYED_CONTRACTS TABLE
CREATE TABLE deployed_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
    
    contract_type VARCHAR(50) NOT NULL, -- 'TokenHome', 'TokenRemote', 'Teleporter', 'TeleporterRegistry'
    address VARCHAR(42) NOT NULL,
    
    -- Deployment Details
    deployer_address VARCHAR(42),
    deployment_tx_hash VARCHAR(66) UNIQUE,
    block_number BIGINT,
    gas_used BIGINT,
    
    -- Configuration (stored as JSONB for flexibility)
    deployment_params JSONB,
    constructor_args JSONB,
    
    -- Status
    is_verified BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    
    deployed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(chain_id, address)
);

CREATE INDEX idx_contracts_chain ON deployed_contracts(chain_id);
CREATE INDEX idx_contracts_type ON deployed_contracts(contract_type);
CREATE INDEX idx_contracts_address ON deployed_contracts(address);
CREATE INDEX idx_contracts_tx_hash ON deployed_contracts(deployment_tx_hash);


-- 6. ICTT_SETUPS TABLE
CREATE TABLE ictt_setups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setup_name VARCHAR(100),
    
    -- Token Home (Source)
    token_home_address VARCHAR(42) NOT NULL,
    token_home_chain_id UUID NOT NULL REFERENCES chains(id),
    token_home_token_id UUID NOT NULL REFERENCES tokens(id),
    token_home_contract_id UUID REFERENCES deployed_contracts(id),
    
    -- Token Remote (Destination)
    token_remote_address VARCHAR(42) NOT NULL,
    token_remote_chain_id UUID NOT NULL REFERENCES chains(id),
    token_remote_token_id UUID NOT NULL REFERENCES tokens(id),
    token_remote_contract_id UUID REFERENCES deployed_contracts(id),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    setup_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'paused', 'deprecated'
    
    -- Metrics
    total_volume NUMERIC(78, 18) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    
    -- Metadata
    deployed_by UUID REFERENCES users(id),
    deployment_config JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(token_home_chain_id, token_home_address, token_remote_chain_id, token_remote_address)
);

CREATE INDEX idx_ictt_home_chain ON ictt_setups(token_home_chain_id);
CREATE INDEX idx_ictt_remote_chain ON ictt_setups(token_remote_chain_id);
CREATE INDEX idx_ictt_status ON ictt_setups(is_active, setup_status);
CREATE INDEX idx_ictt_home_token ON ictt_setups(token_home_token_id);
CREATE INDEX idx_ictt_remote_token ON ictt_setups(token_remote_token_id);


-- 7. GLOBAL_FEE_CONFIG TABLE (Single source of truth for fees)
CREATE TABLE global_fee_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Fee Structure
    bridge_fee_percentage NUMERIC(5, 4) NOT NULL DEFAULT 0.001, -- 0.1% = 0.001
    
    -- Revenue Collection
    fee_collector_address VARCHAR(42),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. TOKEN_PAIRS TABLE (Supported Bridge Routes)
CREATE TABLE token_pairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    source_token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
    destination_token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
    ictt_setup_id UUID REFERENCES ictt_setups(id),
    
    -- Route Info
    is_active BOOLEAN DEFAULT TRUE,
    is_direct BOOLEAN DEFAULT TRUE, -- false if requires multi-hop
    
    -- Liquidity Info
    available_liquidity NUMERIC(78, 18) DEFAULT 0,
    locked_liquidity NUMERIC(78, 18) DEFAULT 0,
    
    -- Performance Metrics
    avg_completion_time INTEGER, -- seconds
    success_rate NUMERIC(5, 4), -- e.g., 0.9950 = 99.50%
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(source_token_id, destination_token_id)
);

CREATE INDEX idx_token_pairs_source ON token_pairs(source_token_id);
CREATE INDEX idx_token_pairs_destination ON token_pairs(destination_token_id);
CREATE INDEX idx_token_pairs_active ON token_pairs(is_active);


-- 9. BRIDGE_OPERATIONS TABLE
CREATE TABLE bridge_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User Info
    user_id UUID REFERENCES users(id),
    user_wallet VARCHAR(42) NOT NULL,
    
    -- Bridge Details
    ictt_setup_id UUID NOT NULL REFERENCES ictt_setups(id),
    token_pair_id UUID REFERENCES token_pairs(id),
    
    -- Source
    source_chain_id UUID NOT NULL REFERENCES chains(id),
    source_token_id UUID NOT NULL REFERENCES tokens(id),
    source_amount NUMERIC(78, 18) NOT NULL,
    source_tx_hash VARCHAR(66),
    
    -- Destination
    destination_chain_id UUID NOT NULL REFERENCES chains(id),
    destination_token_id UUID NOT NULL REFERENCES tokens(id),
    destination_amount NUMERIC(78, 18),
    destination_address VARCHAR(42) NOT NULL,
    destination_tx_hash VARCHAR(66),
    
    -- Fees
    bridge_fee NUMERIC(78, 18) DEFAULT 0,
    bridge_fee_percentage NUMERIC(5, 4), -- Store the percentage used at time of bridge
    gas_fee NUMERIC(78, 18) DEFAULT 0,
    
    -- Status Tracking
    status VARCHAR(20) NOT NULL DEFAULT 'initiated', -- 'initiated', 'confirmed', 'bridging', 'completed', 'failed', 'refunded'
    failure_reason TEXT,
    
    -- Timing
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Teleporter Message
    teleporter_message_id VARCHAR(66),
    relay_attempts INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bridge_ops_user ON bridge_operations(user_wallet);
CREATE INDEX idx_bridge_ops_status ON bridge_operations(status);
CREATE INDEX idx_bridge_ops_source_tx ON bridge_operations(source_tx_hash);
CREATE INDEX idx_bridge_ops_dest_tx ON bridge_operations(destination_tx_hash);
CREATE INDEX idx_bridge_ops_created ON bridge_operations(created_at DESC);
CREATE INDEX idx_bridge_ops_teleporter ON bridge_operations(teleporter_message_id);
CREATE INDEX idx_bridge_ops_setup ON bridge_operations(ictt_setup_id);


-- 10. TRANSACTIONS TABLE (Blockchain Transactions Log)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    chain_id UUID NOT NULL REFERENCES chains(id),
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    
    -- Transaction Details
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42),
    value NUMERIC(78, 18) DEFAULT 0,
    
    -- Gas
    gas_limit BIGINT,
    gas_used BIGINT,
    gas_price NUMERIC(78, 0),
    
    -- Block Info
    block_number BIGINT,
    block_timestamp TIMESTAMP,
    
    -- Status
    status VARCHAR(20), -- 'pending', 'success', 'failed'
    error_message TEXT,
    
    -- Relations
    bridge_operation_id UUID REFERENCES bridge_operations(id),
    contract_deployment_id UUID REFERENCES deployed_contracts(id),
    
    -- Metadata
    input_data TEXT,
    logs JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_chain ON transactions(chain_id);
CREATE INDEX idx_transactions_from ON transactions(from_address);
CREATE INDEX idx_transactions_bridge_op ON transactions(bridge_operation_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- 12. RELAYER_STATUS TABLE
CREATE TABLE relayer_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    relayer_address VARCHAR(42) UNIQUE NOT NULL,
    relayer_name VARCHAR(100),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_heartbeat TIMESTAMP,
    
    -- Supported Chains
    supported_chains JSONB, -- Array of chain IDs
    
    -- Performance
    total_relays INTEGER DEFAULT 0,
    successful_relays INTEGER DEFAULT 0,
    failed_relays INTEGER DEFAULT 0,
    avg_relay_time INTEGER, -- seconds
    
    -- Balance Monitoring
    balance_alerts JSONB, -- {chain_id: {balance, threshold}}
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_relayer_active ON relayer_status(is_active);
CREATE INDEX idx_relayer_address ON relayer_status(relayer_address);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_chains_updated_at BEFORE UPDATE ON chains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chain_rpcs_updated_at BEFORE UPDATE ON chain_rpcs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tokens_updated_at BEFORE UPDATE ON tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployed_contracts_updated_at BEFORE UPDATE ON deployed_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ictt_setups_updated_at BEFORE UPDATE ON ictt_setups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_pairs_updated_at BEFORE UPDATE ON token_pairs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bridge_operations_updated_at BEFORE UPDATE ON bridge_operations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relayer_status_updated_at BEFORE UPDATE ON relayer_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_fee_config_updated_at BEFORE UPDATE ON global_fee_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Insert default fee configuration
INSERT INTO global_fee_config (bridge_fee_percentage, notes) 
VALUES (0.001, 'Default bridge fee of 0.1%');