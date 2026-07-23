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

export const FACTORY_ABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "hoodie_",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "router_",
				"type": "address"
			},
			{
				"internalType": "uint16",
				"name": "globalMaxFeeBps_",
				"type": "uint16"
			},
			{
				"internalType": "uint16",
				"name": "globalMaxCreatorAllocationBps_",
				"type": "uint16"
			},
			{
				"internalType": "address",
				"name": "initialOwner",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "FailedDeployment",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "balance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "InsufficientBalance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint16",
				"name": "globalMaxFeeBps",
				"type": "uint16"
			},
			{
				"indexed": false,
				"internalType": "uint16",
				"name": "globalMaxCreatorAllocationBps",
				"type": "uint16"
			}
		],
		"name": "GlobalCapsUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "launcher",
				"type": "address"
			}
		],
		"name": "LauncherCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "router",
				"type": "address"
			}
		],
		"name": "RouterUpdated",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "HOODIE",
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
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "allLaunchers",
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
		"inputs": [
			{
				"internalType": "address",
				"name": "feeRecipient",
				"type": "address"
			},
			{
				"internalType": "uint16",
				"name": "feeBps",
				"type": "uint16"
			},
			{
				"internalType": "uint16",
				"name": "maxCreatorAllocationBps",
				"type": "uint16"
			},
			{
				"internalType": "uint64",
				"name": "creatorVestingDuration",
				"type": "uint64"
			},
			{
				"components": [
					{
						"internalType": "uint128",
						"name": "virtualTokenReserveBuffer",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "virtualHoodieReserves",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "migrationThreshold",
						"type": "uint128"
					}
				],
				"internalType": "struct TokenLauncher.LaunchDefaults",
				"name": "defaults",
				"type": "tuple"
			}
		],
		"name": "createLauncher",
		"outputs": [
			{
				"internalType": "address",
				"name": "launcher",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			}
		],
		"name": "getLaunchersByOperator",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "globalMaxCreatorAllocationBps",
		"outputs": [
			{
				"internalType": "uint16",
				"name": "",
				"type": "uint16"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "globalMaxFeeBps",
		"outputs": [
			{
				"internalType": "uint16",
				"name": "",
				"type": "uint16"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "launcherImplementation",
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
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "launchersByOperator",
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
		"name": "launchpadImplementation",
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
		"name": "owner",
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
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "router",
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
		"inputs": [
			{
				"internalType": "uint16",
				"name": "newMaxFeeBps",
				"type": "uint16"
			},
			{
				"internalType": "uint16",
				"name": "newMaxCreatorAllocationBps",
				"type": "uint16"
			}
		],
		"name": "setGlobalCaps",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newRouter",
				"type": "address"
			}
		],
		"name": "setRouter",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalLaunchers",
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
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]

export const TOKEN_LAUNCHER_ABI = [
    { inputs: [], name: "FailedDeployment", type: "error" },
    {
      inputs: [
        { internalType: "uint256", name: "balance", type: "uint256" },
        { internalType: "uint256", name: "needed", type: "uint256" },
      ],
      name: "InsufficientBalance",
      type: "error",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: false, internalType: "uint16", name: "maxCreatorAllocationBps", type: "uint16" },
        { indexed: false, internalType: "uint64", name: "creatorVestingDuration", type: "uint64" },
      ],
      name: "CreatorAllocationPolicyUpdated",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          components: [
            { internalType: "uint128", name: "virtualTokenReserveBuffer", type: "uint128" },
            { internalType: "uint128", name: "virtualHoodieReserves", type: "uint128" },
            { internalType: "uint128", name: "migrationThreshold", type: "uint128" },
          ],
          indexed: false,
          internalType: "struct TokenLauncher.LaunchDefaults",
          name: "defaults",
          type: "tuple",
        },
      ],
      name: "DefaultsUpdated",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: false, internalType: "address", name: "feeRecipient", type: "address" },
        { indexed: false, internalType: "uint16", name: "feeBps", type: "uint16" },
      ],
      name: "FeeUpdated",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "creator", type: "address" },
        { indexed: true, internalType: "address", name: "launchpad", type: "address" },
        { indexed: true, internalType: "address", name: "token", type: "address" },
        { indexed: false, internalType: "string", name: "name", type: "string" },
        { indexed: false, internalType: "string", name: "symbol", type: "string" },
        { indexed: false, internalType: "uint256", name: "curveSupply", type: "uint256" },
        { indexed: false, internalType: "uint256", name: "creatorAllocation", type: "uint256" },
        { indexed: false, internalType: "address", name: "vestingWallet", type: "address" },
      ],
      name: "Launched",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "operator", type: "address" },
        { indexed: true, internalType: "address", name: "parentFactory", type: "address" },
      ],
      name: "LauncherInitialized",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "previousOperator", type: "address" },
        { indexed: true, internalType: "address", name: "newOperator", type: "address" },
      ],
      name: "OperatorTransferred",
      type: "event",
    },
    {
      inputs: [],
      name: "HOODIE",
      outputs: [{ internalType: "address", name: "", type: "address" }],
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
    {
      inputs: [],
      name: "creatorVestingDuration",
      outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "defaults",
      outputs: [
        { internalType: "uint128", name: "virtualTokenReserveBuffer", type: "uint128" },
        { internalType: "uint128", name: "virtualHoodieReserves", type: "uint128" },
        { internalType: "uint128", name: "migrationThreshold", type: "uint128" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "feeBps",
      outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "feeBpsCap",
      outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "feeRecipient",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "creator", type: "address" }],
      name: "getLaunchesByCreator",
      outputs: [
        {
          components: [
            { internalType: "address", name: "launchpad", type: "address" },
            { internalType: "address", name: "token", type: "address" },
            { internalType: "address", name: "vestingWallet", type: "address" },
          ],
          internalType: "struct TokenLauncher.LaunchInfo[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "parentFactory_", type: "address" },
        { internalType: "address", name: "launchpadImplementation_", type: "address" },
        { internalType: "address", name: "operator_", type: "address" },
        { internalType: "address", name: "feeRecipient_", type: "address" },
        { internalType: "uint16", name: "feeBps_", type: "uint16" },
        { internalType: "uint16", name: "feeBpsCap_", type: "uint16" },
        { internalType: "uint16", name: "maxCreatorAllocationBps_", type: "uint16" },
        { internalType: "uint16", name: "maxCreatorAllocationBpsCap_", type: "uint16" },
        { internalType: "uint64", name: "creatorVestingDuration_", type: "uint64" },
        {
          components: [
            { internalType: "uint128", name: "virtualTokenReserveBuffer", type: "uint128" },
            { internalType: "uint128", name: "virtualHoodieReserves", type: "uint128" },
            { internalType: "uint128", name: "migrationThreshold", type: "uint128" },
          ],
          internalType: "struct TokenLauncher.LaunchDefaults",
          name: "defaults_",
          type: "tuple",
        },
      ],
      name: "initialize",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "initialized",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "string", name: "name", type: "string" },
        { internalType: "string", name: "symbol", type: "string" },
        { internalType: "uint256", name: "totalSupply", type: "uint256" },
        { internalType: "uint16", name: "creatorAllocationBps", type: "uint16" },
      ],
      name: "launch",
      outputs: [
        { internalType: "address", name: "launchpad", type: "address" },
        { internalType: "address", name: "tokenAddr", type: "address" },
        { internalType: "address", name: "vestingWallet", type: "address" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "", type: "address" },
        { internalType: "uint256", name: "", type: "uint256" },
      ],
      name: "launchesByCreator",
      outputs: [
        { internalType: "address", name: "launchpad", type: "address" },
        { internalType: "address", name: "token", type: "address" },
        { internalType: "address", name: "vestingWallet", type: "address" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "launchpadImplementation",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "maxCreatorAllocationBps",
      outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "maxCreatorAllocationBpsCap",
      outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "operator",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "parentFactory",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "router",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint16", name: "newMaxBps", type: "uint16" },
        { internalType: "uint64", name: "newVestingDuration", type: "uint64" },
      ],
      name: "setCreatorAllocationPolicy",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "uint128", name: "virtualTokenReserveBuffer", type: "uint128" },
            { internalType: "uint128", name: "virtualHoodieReserves", type: "uint128" },
            { internalType: "uint128", name: "migrationThreshold", type: "uint128" },
          ],
          internalType: "struct TokenLauncher.LaunchDefaults",
          name: "newDefaults",
          type: "tuple",
        },
      ],
      name: "setDefaults",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "newFeeRecipient", type: "address" },
        { internalType: "uint16", name: "newFeeBps", type: "uint16" },
      ],
      name: "setFee",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "totalLaunches",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "newOperator", type: "address" }],
      name: "transferOperator",
      outputs: [],
      stateMutability: "nonpayable",
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