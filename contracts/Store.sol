// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

library Store {
    /************* STRUCTS *************/
    struct UserStake {
        uint256 stakedByUser;
        LocksIndex typeLock;
        uint256 lastClaim;
        uint256 lastStake;
    }

    struct LocksData {
        uint128 emissionPerSecondPerUser;
        uint128 timeLocked;
        uint256 totalStaked;
        uint128 totalUsers;
        uint256 maxOvrStakable;
    }

    /************* ENUMS *************/

    enum LocksIndex {
        unlocked, // 0
        threeMonths, // 1
        sixMonths, // 2
        nineMonths, // 3
        twelveMonths // 4
    }

    /************* EVENTS *************/

    event DepositPaused(bool _status);
    event stake(
        address indexed _user,
        uint256 indexed _amount,
        uint256 indexed _timestamp,
        Store.LocksIndex _timeLockIndex
    );
    event claimRewards(
        address indexed _user,
        uint256 indexed _amount,
        uint256 indexed _timestamp,
        Store.LocksIndex _timeLockIndex
    );
    event emergencyWithdraw(
        address indexed _user,
        uint256 indexed _amount,
        uint256 indexed _timestamp,
        Store.LocksIndex _timeLockIndex
    );
    event withdraw(
        address indexed _user,
        uint256 indexed _amount,
        uint256 indexed _timestamp,
        Store.LocksIndex _timeLockIndex
    );
}
