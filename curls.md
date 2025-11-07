### Available Chains
curl --location 'http://localhost:3002/available/chains'

### ICTT Setups for a Specific Chain
curl --location 'http://localhost:3002/available/ictt/a3a29584-dd34-418a-a524-63f844d95865'

### Deploy Bridge
curl --location --request PUT 'http://localhost:3002/deploy/bridge' \
--header 'Content-Type: application/json' \
--data '{
    "homeChain": {
      "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
      "blockchainId": "0x7fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5",
      "tokenAddress": "0x9dafF7B0c496591CC20Af1D8394FF1cB8696c9a7",
      "tokenDecimals": 18,
      "teleporterManagerAddress": "0x50B2Ca22c3093fddA77b504960A9e9b7146e3cc1",
      "minTeleporterVersion": 1,
      "teleporterMessenger": {
        "deploy": false,
        "contractAddress": "0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf"
      },
      "teleporterRegistry": {
        "deploy": false,
        "contractAddress": "0xF86Cb19Ad8405AEFa7d09C778215D2Cb6eBfB228"
      }
    },
    "remoteChain": {
      "rpcUrl": "https://subnets.avax.network/dispatch/testnet/rpc",
      "blockchainId": "0x9f49313c3f022e9fe5b6e7c1d98f0f53d86e53456c5e075e1881cac1c15968e4",
      "teleporterManagerAddress": "0x50B2Ca22c3093fddA77b504960A9e9b7146e3cc1",
      "minTeleporterVersion": 1,
      "tokenName": "Wrapped Mock Token",
      "tokenSymbol": "MCT",
      "tokenDecimals": 18,
      "initialReserveImbalance": 0,
      "teleporterMessenger": {
        "deploy": false,
        "contractAddress": "0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf"
      },
      "teleporterRegistry": {
        "deploy": false,
        "contractAddress": "0xF86Cb19Ad8405AEFa7d09C778215D2Cb6eBfB228"
      }
    }
  }




# Cast Sends

### registerWithHome
cast send 0x7824eeb105DA9720c622D021C7729E0A4D4a7a93 \
  "registerWithHome((address,uint256))" \
  "(0x0000000000000000000000000000000000000000,0)" \
  --rpc-url https://subnets.avax.network/dispatch/testnet/rpc \
  --private-key <>

### Check if it is registered or not
cast call 0x9F94A6D6E3215C631af7A6577228e3857c0626E0 \
"getRemoteTokenTransferrerSettings(bytes32,address)(bool,uint256,uint256,bool)" \
0x9f49313c3f022e9fe5b6e7c1d98f0f53d86e53456c5e075e1881cac1c15968e4 \
0x7824eeb105DA9720c622D021C7729E0A4D4a7a93 \
--rpc-url https://api.avax-test.network/ext/bc/C/rpc