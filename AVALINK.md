# AVA-LINK

## Our Platform

Ava-link is an all-in-one platform that simplifies ERC20 token bridging across all Avalanche L1 chains. We provide seamless interoperability solutions for both chain owners and end users, eliminating the technical complexity traditionally associated with cross-chain token transfers.

## The Problem

Current cross-chain bridging solutions present significant barriers:

- **Complex Setup**: Configuring ICTT (Interchain Token Transfer) and Relayer infrastructure requires extensive technical knowledge
- **Limited Access**: New Avalanche L1 chains lack native ERC20 token transfer capabilities out of the box
- **Fragmented Experience**: Users and chain owners face inconsistent, complicated processes for enabling interoperability

## Our Solution

Ava-link delivers simplicity and accessibility:

- **One-Click ICTT Onboarding**: Chain owners can enable cross-chain functionality instantly, without technical expertise
- **No-Code Token Bridging**: Users can seamlessly transfer tokens between L1 chains through an intuitive interface
- **Universal Interoperability**: Bridge any ERC20 token across all Avalanche L1 chains from a single platform

## Key Benefits

**For Chain Owners:**
- Instant integration with the Avalanche L1 ecosystem
- Zero infrastructure setup and maintenance
- Attract users and liquidity from day one

**For Users:**
- Simple, secure cross-chain token transfers
- Access to any Avalanche L1 chain without switching platforms
- Fast, reliable bridging experience

---

*Making Avalanche L1 interoperability accessible to everyone*
```
┌──────────────────────────────────────────────────────────────┐
│                     PHASE 1: CHAIN ONBOARDING                │
└──────────────────────────────────────────────────────────────┘

Step 1: User Submits Chain Info
├─ Frontend Form:
│  ├─ Chain Name (e.g., "MyChain L1")
│  ├─ RPC URL (e.g., "https://rpc.mychain.com")
│  ├─ Chain ID (e.g., 123456)
│  ├─ Native Symbol (e.g., "MYC")
│  ├─ Block Explorer URL
│  └─ Teleporter Address (if custom)
│
└─ User clicks "Add Chain" → MetaMask signature

Step 2: Validation & Fee Payment
└─ Backend validates:
   ├─ RPC is reachable
   ├─ Chain ID is correct
   ├─ Teleporter exists on chain
   └─ Chain not already registered


Step 3: Automated Deployment
├─ Backend deployment script triggers:
│  ├─ For each existing chain in registry:
│  │  └─ Deploy TokenRemote for new chain
│  │
│  └─ On new chain:
│     ├─ Deploy TokenHome for each existing token
│     └─ Deploy TokenRemote for cross-chain pairs
│
└─ Update registry with deployment addresses

Step 4: Contract Linking
├─ Call registerWithRemote() on all TokenHomes
├─ Call registerWithHome() on all TokenRemotes
└─ Store mapping in database + on-chain registry
```

```
┌──────────────────────────────────────────────────────────────┐
│                   PHASE 2: BRIDGE TOKENS                     │
└──────────────────────────────────────────────────────────────┘

Step 1: User Opens Bridge Website
├─ Sees a familiar Uniswap-like interface
├─ Connects wallet (MetaMask)
└─ No setup needed - ready to use!

Step 2: Select Bridge Details
├─ FROM section:
│  ├─ Select source chain (e.g., "Avalanche C-Chain")
│  ├─ Select token (e.g., "USDC") 
│  ├─ Enter amount (e.g., "100")
│  └─ Shows your balance: "500 USDC"
│
├─ TO section:
│  ├─ Select destination chain (e.g., "DeFi Kingdom")
│  └─ Shows: "You'll receive ~100 USDC in 30 seconds"
│
└─ Review: Fee (~$0.40), Time estimate

Step 3: Approve Token (One-Time)
├─ MetaMask popup: "Allow bridge to spend USDC?"
├─ User confirms
├─ Wait 5 seconds for approval
└─ Only needed once per token

Step 4: Bridge Transaction
├─ User clicks "Bridge Tokens"
├─ MetaMask popup: "Send 100 USDC + $0.40 fee?"
├─ User confirms
└─ Transaction sent to blockchain

```
## Technical Stack

### Backend :
**Framework**: Express.js with PostgreSQL database

**Core Functionality**:
- Chain registry storage (RPC URLs, chain IDs, contract addresses)
- ICTT bridge deployment endpoints
- RPC and contract validation services
- Deployment status tracking and webhooks


### Frontend : 
**Framework**: React.js with TailwindCSS

**User Interfaces**:
- **Chain Admin Portal**: Simple, form-based interface for chain onboarding
  - Input chain details (RPC, Chain ID, Teleporter registry address)
  - Real-time validation feedback
  - Deployment progress tracking

- **Bridge Interface**: Swap-like UI for end users
  - Familiar DEX-style token selection
  - Source/destination chain dropdowns
  - One-click approve and bridge flow

**Web3 Integration**: ethers.js for wallet connection and contract interactions