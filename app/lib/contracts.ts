import { getContract, type Address } from "viem";
import { publicClient } from "./viemClient"; 

export const FACTORY_ADDRESS: Address = "0x085A23A800a7e3F029A053BE866914c8338903e3";

export const LAUNCHPAD_ABI = [
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "SafeERC20FailedOperation",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "buyer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "hoodieIn",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "tokensOut",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "feePaid",
          "type": "uint256"
        }
      ],
      "name": "Buy",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "hoodie",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "creator",
          "type": "address"
        }
      ],
      "name": "Initialized",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "pair",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "tokenLiquidity",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "hoodieLiquidity",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "lpBurned",
          "type": "uint256"
        }
      ],
      "name": "Migrated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "seller",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "tokensIn",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "hoodieOut",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "feePaid",
          "type": "uint256"
        }
      ],
      "name": "Sell",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "hoodieIn",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "minTokensOut",
          "type": "uint256"
        }
      ],
      "name": "buy",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "creator",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "currentPrice",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "factory",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "hoodie",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token_",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "hoodie_",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "creator_",
          "type": "address"
        },
        {
          "internalType": "uint128",
          "name": "virtualTokenReserves_",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "virtualHoodieReserves_",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "realTokenReserves_",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "migrationThreshold_",
          "type": "uint128"
        }
      ],
      "name": "initialize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "initialized",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "isMigrated",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "migrated",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "migrationThreshold",
      "outputs": [
        {
          "internalType": "uint128",
          "name": "",
          "type": "uint128"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "pair",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "realHoodieReserves",
      "outputs": [
        {
          "internalType": "uint128",
          "name": "",
          "type": "uint128"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "realTokenReserves",
      "outputs": [
        {
          "internalType": "uint128",
          "name": "",
          "type": "uint128"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokensIn",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "minHoodieOut",
          "type": "uint256"
        }
      ],
      "name": "sell",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "token",
      "outputs": [
        {
          "internalType": "contract LaunchToken",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "virtualHoodieReserves",
      "outputs": [
        {
          "internalType": "uint128",
          "name": "",
          "type": "uint128"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "virtualTokenReserves",
      "outputs": [
        {
          "internalType": "uint128",
          "name": "",
          "type": "uint128"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ] as const;

  export const TOKEN_LAUNCHER_ADDRESS: Address = "0x347434e6E53948d150C703d3D935d38AE0E75459";

  export const TOKEN_LAUNCHER_ABI = [
    {
      inputs: [],
      name: "totalLaunches",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      name: "allLaunches",
      outputs: [
        { internalType: "address", name: "launchpad", type: "address" },
        { internalType: "address", name: "token", type: "address" },
        { internalType: "address", name: "vestingWallet", type: "address" },
      ],
      stateMutability: "view",
      type: "function",
    },
  ] as const;

export const ERC20_ABI = [
    {
      inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
      name: "approve",
      outputs: [{ type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
      name: "allowance",
      outputs: [{ type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [{ type: "uint8" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [{ type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [{ type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSupply",
      outputs: [{ type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [{ type: "uint8" }],
      stateMutability: "view",
      type: "function",
    },
  ] as const;

export function getLaunchpadContract(address: Address) {
  return getContract({ address, abi: LAUNCHPAD_ABI, client: publicClient });
}

export function getErc20Contract(address: Address) {
  return getContract({ address, abi: ERC20_ABI, client: publicClient });
}