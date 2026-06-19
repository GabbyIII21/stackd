import { base } from "wagmi/chains";

// StackdRegistry on Base Mainnet. Override with VITE_STACKD_REGISTRY_ADDRESS.
// (Same address on Base Sepolia — deployed from the same deployer at nonce 0.)
export const REGISTRY_ADDRESS = (import.meta.env.VITE_STACKD_REGISTRY_ADDRESS ??
  "0x27A114c7C0e0d0ef97538407C447D7601c940d4D") as `0x${string}`;

// The chain StackdRegistry is deployed on.
export const REGISTRY_CHAIN = base;

export const STACKD_REGISTRY_ABI = [
  {
    type: "function",
    name: "CATEGORY_COUNT",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "FREEZE_MILESTONE_STEP",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint32",
        internalType: "uint32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "activateFreeze",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "builderScore",
    inputs: [
      {
        name: "builder",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "canActivateFreeze",
    inputs: [
      {
        name: "builder",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBuilder",
    inputs: [
      {
        name: "builder",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "currentStreak",
        type: "uint32",
        internalType: "uint32",
      },
      {
        name: "longestStreak",
        type: "uint32",
        internalType: "uint32",
      },
      {
        name: "totalLogs",
        type: "uint32",
        internalType: "uint32",
      },
      {
        name: "lastDay",
        type: "uint32",
        internalType: "uint32",
      },
      {
        name: "freezeAvailable",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "exists",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "firstLogAt",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "registrationIndex",
        type: "uint32",
        internalType: "uint32",
      },
      {
        name: "score",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBuilderAt",
    inputs: [
      {
        name: "index",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBuilderCount",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBuildersPaged",
    inputs: [
      {
        name: "offset",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "limit",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "page",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLogCount",
    inputs: [
      {
        name: "builder",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLogs",
    inputs: [
      {
        name: "builder",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct StackdRegistry.Log[]",
        components: [
          {
            name: "day",
            type: "uint32",
            internalType: "uint32",
          },
          {
            name: "category",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "isFreeze",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "timestamp",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "streak",
            type: "uint32",
            internalType: "uint32",
          },
          {
            name: "cid",
            type: "string",
            internalType: "string",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLogsPaged",
    inputs: [
      {
        name: "builder",
        type: "address",
        internalType: "address",
      },
      {
        name: "offset",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "limit",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "page",
        type: "tuple[]",
        internalType: "struct StackdRegistry.Log[]",
        components: [
          {
            name: "day",
            type: "uint32",
            internalType: "uint32",
          },
          {
            name: "category",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "isFreeze",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "timestamp",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "streak",
            type: "uint32",
            internalType: "uint32",
          },
          {
            name: "cid",
            type: "string",
            internalType: "string",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasActedToday",
    inputs: [
      {
        name: "builder",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "liveStreak",
    inputs: [
      {
        name: "builder",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint32",
        internalType: "uint32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "logBuild",
    inputs: [
      {
        name: "cid",
        type: "string",
        internalType: "string",
      },
      {
        name: "category",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "BuildLogged",
    inputs: [
      {
        name: "builder",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "day",
        type: "uint32",
        indexed: true,
        internalType: "uint32",
      },
      {
        name: "category",
        type: "uint8",
        indexed: false,
        internalType: "uint8",
      },
      {
        name: "currentStreak",
        type: "uint32",
        indexed: false,
        internalType: "uint32",
      },
      {
        name: "longestStreak",
        type: "uint32",
        indexed: false,
        internalType: "uint32",
      },
      {
        name: "totalLogs",
        type: "uint32",
        indexed: false,
        internalType: "uint32",
      },
      {
        name: "cid",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "BuilderRegistered",
    inputs: [
      {
        name: "builder",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "registrationIndex",
        type: "uint32",
        indexed: false,
        internalType: "uint32",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FreezeActivated",
    inputs: [
      {
        name: "builder",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "day",
        type: "uint32",
        indexed: true,
        internalType: "uint32",
      },
      {
        name: "currentStreak",
        type: "uint32",
        indexed: false,
        internalType: "uint32",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FreezeMinted",
    inputs: [
      {
        name: "builder",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "atStreak",
        type: "uint32",
        indexed: false,
        internalType: "uint32",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "AlreadyLoggedToday",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyCid",
    inputs: [],
  },
  {
    type: "error",
    name: "FreezeNotApplicable",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidCategory",
    inputs: [],
  },
  {
    type: "error",
    name: "NoFreezeAvailable",
    inputs: [],
  },
  {
    type: "error",
    name: "NoHistory",
    inputs: [],
  },
] as const;
