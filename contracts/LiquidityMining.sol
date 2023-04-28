// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {Store} from "./Store.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

//consolelog
import "hardhat/console.sol";

contract LiquidityMining is AccessControl, ReentrancyGuard, Pausable {
    using SafeMath for uint;
    IERC20 public LPTokens;
    IERC20 public OVR;
    bool public depositPaused;
    uint256 public endStaking;

    mapping(Store.LocksIndex => Store.LocksData) public locks;
    mapping(address => mapping(Store.LocksIndex => Store.UserStake))
        public users;

    constructor(IERC20 _LPTokens, IERC20 _OVR) {
        LPTokens = _LPTokens;
        OVR = _OVR;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /************* MODIFIER *************/

    modifier whenNotDepositPaused() {
        require(!depositPaused, "deposit paused");
        _;
    }

    /************* PUBLIC FUNCTIONS *************/

    /**
     * @dev Stake tokens for a specific lock
     * @param _amount The amount of tokens to stake
     * @param _timeLockIndex The index of the lock
     */
    function stake(
        uint256 _amount,
        Store.LocksIndex _timeLockIndex
    ) external nonReentrant whenNotPaused whenNotDepositPaused {
        if (users[_msgSender()][_timeLockIndex].stakedByUser > 0) {
            claimRewards(_timeLockIndex);
        } else {
            locks[_timeLockIndex].totalUsers++;
        }

        require(_amount > 0, "LiquidityMining: Cannot stake 0 tokens");
        locks[_timeLockIndex].totalStaked = locks[_timeLockIndex]
            .totalStaked
            .add(_amount);
        (, uint256 ovrStaked) = lockInfo(_timeLockIndex);
        require(
            ovrStaked < locks[_timeLockIndex].maxOvrStakable + 1,
            "Max stakable reached"
        );

        LPTokens.transferFrom(_msgSender(), address(this), _amount);

        users[_msgSender()][_timeLockIndex] = Store.UserStake(
            users[_msgSender()][_timeLockIndex].stakedByUser.add(_amount),
            _timeLockIndex,
            block.timestamp,
            block.timestamp
        );

        emit Store.stake(
            _msgSender(),
            _amount,
            block.timestamp,
            _timeLockIndex
        );
    }

    /**
     * @dev Claim rewards tokens for a specific lock
     * @param _timeLockIndex The index of the lock
     */
    function claimRewards(
        Store.LocksIndex _timeLockIndex
    ) public nonReentrant whenNotPaused {
        require(
            users[_msgSender()][_timeLockIndex].stakedByUser > 0,
            "LiquidityMining: No tokens staked"
        );

        uint256 rewards = rewardsToClaim(_msgSender(), _timeLockIndex);
        if (rewards > 0) {
            users[_msgSender()][_timeLockIndex].lastClaim = block.timestamp;
            OVR.transfer(_msgSender(), rewards);

            emit Store.claimRewards(
                _msgSender(),
                rewards,
                block.timestamp,
                _timeLockIndex
            );
        }
    }

    /**
     * @dev If token for rewards are not enough, users can call emergencyWithdraw to unstake their tokens
     * @param _timeLockIndex The index of the lock
     */
    function emergencyWithdraw(
        Store.LocksIndex _timeLockIndex
    ) external nonReentrant whenNotPaused {
        require(
            users[_msgSender()][_timeLockIndex].stakedByUser > 0,
            "LiquidityMining: No tokens staked"
        );
        require(
            block.timestamp >=
                users[_msgSender()][_timeLockIndex].lastStake +
                    locks[_timeLockIndex].timeLocked,
            "LiquidityMining: Cannot unstake yet"
        );
        LPTokens.transfer(
            _msgSender(),
            users[_msgSender()][_timeLockIndex].stakedByUser
        );
        locks[_timeLockIndex].totalUsers--;
        locks[_timeLockIndex].totalStaked = locks[_timeLockIndex]
            .totalStaked
            .sub(users[_msgSender()][_timeLockIndex].stakedByUser);

        emit Store.emergencyWithdraw(
            _msgSender(),
            users[_msgSender()][_timeLockIndex].stakedByUser,
            block.timestamp,
            _timeLockIndex
        );
        delete users[_msgSender()][_timeLockIndex];
    }

    /**
     * @dev Unstake all tokens and claim rewards
     * @param _timeLockIndex The index of the lock
     */
    function unstakeAll(
        Store.LocksIndex _timeLockIndex
    ) external nonReentrant whenNotPaused {
        require(
            block.timestamp >=
                users[_msgSender()][_timeLockIndex].lastStake +
                    locks[_timeLockIndex].timeLocked,
            "LiquidityMining: Cannot unstake yet"
        );
        require(
            users[_msgSender()][_timeLockIndex].stakedByUser > 0,
            "LiquidityMining: No tokens staked"
        );
        uint256 rewards = rewardsToClaim(_msgSender(), _timeLockIndex);
        if (rewards > 0) OVR.transfer(_msgSender(), rewards);
        LPTokens.transfer(
            _msgSender(),
            users[_msgSender()][_timeLockIndex].stakedByUser
        );
        locks[_timeLockIndex].totalUsers--;
        locks[_timeLockIndex].totalStaked = locks[_timeLockIndex]
            .totalStaked
            .sub(users[_msgSender()][_timeLockIndex].stakedByUser);
        emit Store.withdraw(
            _msgSender(),
            users[_msgSender()][_timeLockIndex].stakedByUser,
            block.timestamp,
            _timeLockIndex
        );
        delete users[_msgSender()][_timeLockIndex];
    }

    /************* VIEW FUNCTIONS *************/

    function lockInfo(
        Store.LocksIndex _timeLockIndex
    ) public view returns (uint256, uint256) {
        uint256 ovrStaked = ((OVR.balanceOf(address(LPTokens))) *
            locks[_timeLockIndex].totalStaked) /
            IERC20(address(LPTokens)).totalSupply();

        return (locks[_timeLockIndex].maxOvrStakable, ovrStaked);
    }

    /**
     * @dev Returns the amount of rewards that can be claimed by the user
     * @param _user The address of the user
     * @param _timeLockIndex The index of the lock
     * @return The amount of rewards that can be claimed by the user
     */
    function rewardsToClaim(
        address _user,
        Store.LocksIndex _timeLockIndex
    ) public view whenNotPaused returns (uint256) {
        if (users[_user][_timeLockIndex].stakedByUser == 0) {
            return 0;
        }

        //since V2 pools are 50/50, we can just multiply by 2 the amount of OVR in the pool
        //the result is the total value in OVR of the pool (2 * OVRPool = OVRPool + ETHPool)
        uint256 userBalance = ((2 * OVR.balanceOf(address(LPTokens))) *
            users[_user][_timeLockIndex].stakedByUser) /
            IERC20(address(LPTokens)).totalSupply();

        uint256 lockExpiration = users[_user][_timeLockIndex].lastStake +
            locks[_timeLockIndex].timeLocked;

        bool endStakingExist = endStaking > 0;

        uint128 emission = locks[_timeLockIndex].emissionPerSecondPerUser *
            1e18;

        uint256 lastClaim = users[_user][_timeLockIndex].lastClaim;

        //if now is < than the end of the lockup, earn lock's emission
        if (block.timestamp < lockExpiration) {
            uint256 timeDelta = block.timestamp > endStaking && endStakingExist
                ? endStaking - lastClaim
                : block.timestamp - lastClaim;

            uint256 _rewards = (userBalance * emission * timeDelta) / 1e36;

            return _rewards;
        }

        //if now is > than the end of the locks and lastClaim < than the end of the lock, earn lockup emission + unlocked emission
        if (block.timestamp >= lockExpiration && lastClaim < lockExpiration) {
            uint256 timeDeltaLock = lockExpiration > endStaking &&
                endStakingExist
                ? endStaking - lastClaim
                : lockExpiration - lastClaim;

            uint256 _rewardsLock = (userBalance * emission * timeDeltaLock) /
                1e36;

            if (lockExpiration > endStaking && endStakingExist) {
                return _rewardsLock;
            }

            uint256 timeDelta = block.timestamp > endStaking && endStakingExist
                ? endStaking - lockExpiration
                : block.timestamp - lockExpiration;

            uint256 _rewards = (userBalance * emission * timeDelta) / 1e36;

            return _rewardsLock + _rewards;
        } else {
            //earn only unlocked emission
            uint256 timeDelta = block.timestamp > endStaking && endStakingExist
                ? endStaking - lastClaim
                : block.timestamp - lastClaim;

            uint256 _rewards = (userBalance * emission * timeDelta) / 1e36;

            return _rewards;
        }
    }

    /************* ADMIN FUNCTIONS *************/

    /**
     * @dev Configure the emission per second for each lock and the time locked
     * @param _emissionPerSecond The emission per second
     * @param _timeLockIndex The index of the lock
     * @param _timeLocked The time locked
     * @notice The emission per second is multiplied by 1e18,
     * time locked is in seconds and the function can be called only by the admin
     */
    function configureLocks(
        uint128 _emissionPerSecond,
        Store.LocksIndex _timeLockIndex,
        uint128 _timeLocked,
        uint256 _maxOvrStakable
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_maxOvrStakable > 0, "Invalid max OVR stakable");
        require(
            _timeLockIndex <= Store.LocksIndex.twelveMonths,
            "Invalid index"
        );
        locks[_timeLockIndex].emissionPerSecondPerUser = _emissionPerSecond;
        locks[_timeLockIndex].maxOvrStakable = _maxOvrStakable;
        if (_timeLocked > 0) locks[_timeLockIndex].timeLocked = _timeLocked;
    }

    /**
     * @dev Withdraw tokens from the contract
     * @param _token The address of the token
     * @param _amount The amount of tokens to withdraw
     * @param _to The address to send the tokens to
     * @notice The function can be called only by the admin, no one can withdraw LP tokens
     */
    function withdrawToken(
        address _token,
        uint256 _amount,
        address _to
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            _token != address(LPTokens),
            "LiquidityMining: Cannot withdraw LP tokens"
        );
        IERC20(_token).transfer(_to, _amount);
    }

    function pauseDeposit(uint256 unix) external onlyRole(DEFAULT_ADMIN_ROLE) {
        depositPaused = true;
        endStaking = unix;
    }

    function unpauseDeposit() external onlyRole(DEFAULT_ADMIN_ROLE) {
        depositPaused = false;
        endStaking = 0;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
