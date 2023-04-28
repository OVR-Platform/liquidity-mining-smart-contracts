# Smart Contract - LiquidityMining

Smart contract for liquidity mining with OVR and WETH LPTokens.

## Features

- Stake LPTokens to receive rewards.
- Configure time-locked emission rates for different time lock periods.
- Claim rewards based on time-locked emission rates.
- Unstake all tokens after the time lock period and claim rewards.

## Contract Details

- Contract Name: LiquidityMining
- Solidity Version: ^0.8.9
- External Libraries: SafeMath, AccessControl, ReentrancyGuard, Pausable
- Contract Dependencies: Store

# Functions

## Constructor

```solidity
constructor(
    IUniswapV2Pair _LPTokens,
    IERC20 _OVR
)
```

- Initializes the contract with the required parameters.
- \_LPTokens: The address of the Uniswap V2 pair contract for liquidity pool tokens.
- \_OVR: The address of the OVR token contract.

## configureLocks

```solidity
function configureLocks(
    uint128 _emissionPerSecond,
    Store.LocksIndex _timeLockIndex,
    uint128 _timeLocked,
    uint256 _maxOvrStakable
) external onlyRole(DEFAULT_ADMIN_ROLE)
```

Configures the emission rate and time lock period for a given time lock index.

- \_emissionPerSecond: The emission rate per second for the time lock index.
- \_timeLockIndex: The index of the time lock period.
- \_timeLocked: The duration of the time lock period in seconds.
- \_maxOvrStakable: The maximum amount of OVR tokens that can be staked for the time lock period.

⚠️⚠️ **How to calculate emissionPerSecond?** ⚠️⚠️

- emissionPerSecond = (N% / 100) / Seconds in a year (31536000)
- Example:

  - 20% apr per year
  - emissionPerSecond = (20% / 100) / 31536000 = 0.2 / 31536000 = 0.0000000063419584 (has 16 decimals, add 0s to reach 18 decimals) = 0.000000006341958400 (18 decimals) = 6341958400

**How rewards are calculated?**

Contract calculates rewards based on the time-locked emission rate for a given time lock index.
It takes the Delta time (current time - last time rewards were claimed), take the user's staked amount and the time-locked emission rate.
multiply the emission rate for 1e18 to get the max precision possible, then multiply the result _ staked amount _ delta time and divide the result by 1e36 (since we multiplied the emission rate for 1e18 twice)

## stake

```solidity
function stake(
    uint256 _amount,
    Store.LocksIndex _timeLockIndex
) external nonReentrant whenNotPaused
```

Stakes Amount of LPTokens to get rewards.

- \_amount: The amount of LPTokens to stake.
- \_timeLockIndex: The index of the time lock period for which the tokens are staked.

## claimRewards

```solidity
function claimRewards(
    Store.LocksIndex _timeLockIndex
) public nonReentrant whenNotPaused
```

Claims rewards based on the time-locked emission rate for a given time lock index.

- \_timeLockIndex: The index of the time lock period for which rewards are claimed.

## unstakeAll

```solidity
function unstakeAll(
    Store.LocksIndex _timeLockIndex
) external nonReentrant whenNotPaused
```

Unstakes all tokens and claims rewards after the time lock period for a given time lock index.

- \_timeLockIndex: The index of the time lock period for which tokens are unstaked.

## Pause deposit

```solidity
    function pauseDeposit(uint256 unix) external onlyRole(DEFAULT_ADMIN_ROLE) {
        depositPaused = true;
        endStaking = unix;
    }
```

Pauses deposit of LPTokens and stop rewards emission to the selected time.

- \_unix: The unix timestamp to stop rewards emission.
