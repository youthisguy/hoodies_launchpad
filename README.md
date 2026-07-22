# HOODIE Launcher Launcher

A token launcher *launcher* on Robinhood Chain. Anyone can spin up their own independent, reusable token launchpad — and every token launched through any of them, by anyone, is permanently paired with $HOODIE. Not as a UI default. As the only code path that exists.

---

## Live Deployment (Robinhood Chain — Chain ID 4663)

| Contract | Address |
|---|---|
| **HoodieLauncherFactory** (the launcher launcher) | [`0x085A23A800a7e3F029A053BE866914c8338903e3`](https://robinhoodchain.blockscout.com/address/0x085A23A800a7e3F029A053BE866914c8338903e3) |
| **HOODIE** (immutable pairing asset) | [`0xC72c01AAB5f5678dc1d6f5C6d2B417d91D402Ba3`](https://robinhoodchain.blockscout.com/token/0xC72c01AAB5f5678dc1d6f5C6d2B417d91D402Ba3) |
| Uniswap V2 Router | `0x89e5db8b5aa49aa85ac63f691524311aeb649eba` |
| Uniswap V2 Factory | `0x8bceaa40b9acdfaedf85adf4ff01f5ad6517937f` |

### Example launcher + launch (test data)

| | Address |
|---|---|
| TokenLauncher (test) | [`0x347434e6E53948d150C703d3D935d38AE0E75459`](https://robinhoodchain.blockscout.com/address/0x347434e6E53948d150C703d3D935d38AE0E75459) |
| CHIPS launchpad | [`0x54C113A4615aFaC61Bc8C9FEE336f0EB0084c6a1`](https://robinhoodchain.blockscout.com/address/0x54C113A4615aFaC61Bc8C9FEE336f0EB0084c6a1) |
| CHIPS token | [`0x540f43F399da8e8EcB7710Af694910790803c044`](https://robinhoodchain.blockscout.com/token/0x540f43F399da8e8EcB7710Af694910790803c044) |

---

## The Immutable Rule

`HOODIE` is set once, in the top-level factory's constructor, as `immutable`:

```solidity
address public immutable HOODIE;
```

There is no setter for it — not in `HoodieLauncherFactory`, not in `TokenLauncher`, not in `TokenLaunchpad`. Every `TokenLauncher` reads it live from the parent factory on every launch, rather than storing its own copy, so it's structurally impossible for any launcher — no matter who deploys or operates it — to pair a token with anything other than HOODIE. This holds during the bonding-curve phase and after migration: every AMM pool created on graduation is `TOKEN/HOODIE`, never anything else.

---

## Architecture

Three tiers, each an on-chain factory for the one below it:

```
HoodieLauncherFactory                    "the launcher launcher" — deployed once
   │  immutable: HOODIE
   │  owner-controlled: router, global fee/allocation caps
   │
   └── createLauncher() ──────────────► TokenLauncher (clone)   "a launcher" — anyone can deploy one
                                            │  own operator, own fee revenue, own curve defaults
                                            │  reads HOODIE + router live from the parent — can't diverge
                                            │
                                            └── launch() ──────► TokenLaunchpad (clone) + LaunchToken
                                                                     bonding curve, denominated in HOODIE,
                                                                     migrates to a HOODIE-paired AMM pool
```

### Contracts

| File | Role |
|---|---|
| `HoodieLauncherFactory.sol` | Deploys `TokenLauncher` instances. Holds the immutable `HOODIE` address and the shared AMM router. Sets global ceilings on fees and creator allocation that no launcher can exceed. |
| `TokenLauncher.sol` | One per operator. Lets its operator launch unlimited tokens, each through a fresh `TokenLaunchpad`, with that operator's own fee recipient/rate and bonding-curve defaults — all bounded by the caps set when the launcher was created. |
| `TokenLaunchpad.sol` | One per launched token. A virtual-reserve constant-product bonding curve (the pump.fun mechanism) denominated entirely in HOODIE. Automatically migrates to a Uniswap V2 `TOKEN/HOODIE` pool once the raise crosses its migration threshold, and burns the resulting LP tokens so liquidity is locked permanently. |
| `LaunchToken.sol` | Fixed-supply ERC20 for each launched token. The full supply is minted once, at creation, split between the curve and (optionally) a vesting wallet for the creator's allocation. No mint function exists afterward. |

### Why liquidity can't be pulled

- **LP tokens are sent to the burn address** (`0x…dEaD`) on migration, not held by any contract or wallet — nobody, including the launcher operator or the top-level owner, can withdraw it.
- **Creator allocations vest linearly** through an OpenZeppelin `VestingWallet` rather than landing liquid in the creator's wallet at launch, capped protocol-wide (default 20%, hard-capped in code at 50%) so a launch can't be structured as a disguised pre-mine dump.
- **The router is never delegated to launcher operators.** It's owner-controlled at the top level only, since a malicious or swapped router is how migration liquidity actually gets stolen.

---

## Bonding Curve Mechanics

Each `TokenLaunchpad` uses virtual reserves seeded at initialization:

- `virtualTokenReserves = curveSupply + virtualTokenReserveBuffer`
- `virtualHoodieReserves` — starting virtual HOODIE reserve, sets initial price
- Price follows `x * y = k`; every `buy()`/`sell()` moves the curve along that constant-product invariant, same mechanism as pump.fun, without needing an oracle.

When `realHoodieReserves >= migrationThreshold`, the contract automatically:
1. Creates (or finds) the `TOKEN/HOODIE` Uniswap V2 pair
2. Deposits all remaining token + HOODIE balance as liquidity
3. Sends the resulting LP tokens to the burn address
4. Disables further curve trading — the token now trades purely on the AMM

---

## Contract API

### HoodieLauncherFactory

| Function | Description |
|---|---|
| `createLauncher(feeRecipient, feeBps, maxCreatorAllocationBps, creatorVestingDuration, defaults)` | Deploy a new independent `TokenLauncher`, owned by the caller |
| `setRouter(newRouter)` | Owner-only. Updates the shared AMM router for all launchers |
| `setGlobalCaps(maxFeeBps, maxCreatorAllocationBps)` | Owner-only. Caps future/existing launchers can't exceed |
| `HOODIE()` | The immutable pairing asset |
| `getLaunchersByOperator(operator)` | All launchers deployed by an address |

### TokenLauncher

| Function | Description |
|---|---|
| `launch(name, symbol, totalSupply, creatorAllocationBps)` | Deploy a new token + bonding curve through this launcher |
| `setFee(feeRecipient, feeBps)` | Operator-only, bounded by the cap fixed at creation |
| `setDefaults(defaults)` | Operator-only. Curve shape for future launches through this launcher |
| `setCreatorAllocationPolicy(maxBps, vestingDuration)` | Operator-only, bounded by the cap fixed at creation |
| `HOODIE()` / `router()` | Proxied live from the parent factory — always in sync |

### TokenLaunchpad

| Function | Description |
|---|---|
| `buy(hoodieIn, minTokensOut)` | Buy tokens along the curve with HOODIE |
| `sell(tokensIn, minHoodieOut)` | Sell tokens back into the curve (pre-migration only) |
| `currentPrice()` | Spot price, HOODIE per whole token |
| `isMigrated()` | Whether the curve has graduated to an AMM pool |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.24, OpenZeppelin Contracts 5.6 |
| Chain | Robinhood Chain (Arbitrum Orbit L2, Chain ID 4663) |
| AMM | Uniswap V2 |
| Compiler | solc, optimizer enabled (200 runs), `viaIR: true` |

---

## Local Development

```bash
npm install
node compile.cjs        # standalone solc compile check, no full toolchain needed
```

Contracts are written to compile directly in Remix (`remix.ethereum.org`) — drop the `contracts/` folder in as-is, OpenZeppelin imports resolve automatically via npm.

```
contracts/
├── HoodieLauncherFactory.sol
├── TokenLauncher.sol
├── TokenLaunchpad.sol
├── LaunchToken.sol
└── interfaces/
    ├── IUniswapV2Factory.sol
    └── IUniswapV2Router02.sol
```

### Deploying a new factory

```
HoodieLauncherFactory constructor:
  hoodie_                        0xC72c01AAB5f5678dc1d6f5C6d2B417d91D402Ba3
  router_                        0x89e5db8b5aa49aa85ac63f691524311aeb649eba
  globalMaxFeeBps_                100    // 1%
  globalMaxCreatorAllocationBps_  2000   // 20%
  initialOwner                   <your address>
```

### Creating a launcher

```
createLauncher(
  feeRecipient,
  feeBps,                  // <= globalMaxFeeBps
  maxCreatorAllocationBps, // <= globalMaxCreatorAllocationBps
  creatorVestingDuration,  // seconds, e.g. 15552000 = 180 days
  defaults: (virtualTokenReserveBuffer, virtualHoodieReserves, migrationThreshold)
)
```

### Launching a token

```
// on the TokenLauncher address, not the factory
launch(name, symbol, totalSupply, creatorAllocationBps)
```

---

## Testing the Full Flow

1. Deploy `HoodieLauncherFactory`
2. Call `createLauncher(...)` → grab the new `TokenLauncher` address from the `LauncherCreated` event
3. Call `launch(...)` on that `TokenLauncher` → grab `launchpad`/`tokenAddr` from the `Launched` event
4. `approve()` HOODIE spend to the new launchpad address
5. `buy(hoodieIn, minTokensOut)` on the launchpad
6. Confirm `realHoodieReserves()` / `realTokenReserves()` moved and your token balance increased
7. Once `realHoodieReserves() >= migrationThreshold`, migration fires automatically on the next `buy()` — confirm a `Migrated` event and that the resulting Uniswap pair's LP balance sits at the burn address

---

## Security Notes

- `HOODIE` — immutable, no setter, anywhere in the contract hierarchy
- `router` — owner-controlled only at the top level, never delegated to launcher operators
- LP tokens from every migration — sent directly to `0x…dEaD`, unrecoverable by design
- Creator allocations — vested linearly via `VestingWallet`, capped protocol-wide
- `LaunchToken` — fixed supply, no mint function after construction
