const { expect } = require("chai");

const { ethers, upgrades } = require("hardhat");
const { time } = require("@openzeppelin/test-helpers");

const Utils = require("./utils");

const OVRAddress = "0x21BfBDa47A0B4B5b1248c767Ee49F7caA9B23697";
const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const LPAddress = "0x0B0d6c11d26B58cB25F59bD9B14190C8941e58fc";
const routerAddress = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";
const wethAbi = require("./abis/weth-abi.json");
const uniswapV2RouterAbi = require("./abis/uniswap-abi.json");

describe("LiquidityMining - TEST", async () => {
  let liquidityMining, LiquidityMining, wethContract, uniswapV2Router;

  beforeEach(async () => {
    LiquidityMining = await ethers.getContractFactory("LiquidityMining");

    [
      owner, // 50 ether
      addr1, // 0
      addr2, // 0
      addr3, // 0
      addr4, // 0
      addr5, // 0
      addr6, // 0
      addr7, // 0
      addr8, // 0
      addr9, // 0
      addr10, // 0
      addr11, // 0
      addr12, // 0
      addr13, // 0
      addr14, // 0
      addr15, // 0
      addr16, // 0
      addr17, // 0
      addr18, // 1000 ether
    ] = await ethers.getSigners();

    wethContract = new ethers.Contract(WETHAddress, wethAbi, owner);
    uniswapV2Router = new ethers.Contract(
      routerAddress,
      uniswapV2RouterAbi,
      owner
    );
    OVRContract = new ethers.Contract(OVRAddress, wethAbi, owner);
    LPContract = new ethers.Contract(LPAddress, wethAbi, owner);
  });

  describe("LiquidityMining - TEST", async () => {
    it("should Deploy", async () => {
      liquidityMining = await LiquidityMining.deploy(LPAddress, OVRAddress);
      await liquidityMining.deployed();
    });
    it("should deposit eth into weth", async () => {
      let amountDeposit = "10";
      await wethContract.deposit({
        value: Utils.toWei(amountDeposit),
      });
      const balance = await wethContract.balanceOf(owner.address);
      expect(balance).to.equal(ethers.utils.parseEther(amountDeposit));
    });
    //buy OVR for ETH from uniswap
    it("should buy OVR for ETH from uniswap", async () => {
      const amountDeposit = "10";
      console.log("amountDeposit", amountDeposit);
      await uniswapV2Router.swapExactETHForTokens(
        0,
        [WETHAddress, OVRAddress],
        owner.address,
        Math.floor(Date.now() / 1000) + 60 * 20,
        {
          value: Utils.toWei(amountDeposit),
        }
      );
      const balance = await OVRContract.balanceOf(owner.address);

      console.log("balance", Utils.fromWei(balance.toString()));
      await OVRContract.transfer(liquidityMining.address, Utils.toWei("1000"));
    });
    it("should configure locks", async () => {
      emissions = [317097920, 1585489600, 3170979200, 4756468800, 6341958400];
      seconds = [
        0,
        Utils.MONTH * 3,
        Utils.MONTH * 6,
        Utils.MONTH * 9,
        31536000,
      ];
      for (let i = 0; i < emissions.length; i++) {
        await liquidityMining.configureLocks(
          emissions[i],
          i,
          seconds[i],
          "10000000000000000000000"
        );
      }
    });
    it("should approve Tokens", async () => {
      const amountDeposit = "100000000000000000000000";
      await LPContract.approve(
        liquidityMining.address,
        Utils.toWei(amountDeposit)
      );
      const allowance = await OVRContract.allowance(
        owner.address,
        liquidityMining.address
      );
      await OVRContract.approve(
        uniswapV2Router.address,
        Utils.toWei(amountDeposit)
      );
      console.log("allowance", Utils.fromWei(allowance.toString()));
    });
    it("should add liwuidity on V2", async () => {
      const balanceOvrBefore = await OVRContract.balanceOf(owner.address);
      const amountDeposit = "100";
      await uniswapV2Router.addLiquidityETH(
        OVRAddress,
        Utils.toWei(amountDeposit),
        0,
        0,
        owner.address,
        Math.floor(Date.now() / 1000) + 60 * 20,
        {
          value: Utils.toWei(amountDeposit),
        }
      );
      const balance = await LPContract.balanceOf(owner.address);
      console.log("balance", Utils.fromWei(balance.toString()));
      const balanceOvrAfter = await OVRContract.balanceOf(owner.address);
      console.log(
        "balanceOvrAfter",
        Utils.fromWei((balanceOvrBefore - balanceOvrAfter).toString())
      );
    });

    it("should deposit OVR and ETH into liquidityMining contract", async () => {
      const amountDeposit = LPContract.balanceOf(owner.address);

      await liquidityMining.stake(amountDeposit, 1);
      const balance = await LPContract.balanceOf(liquidityMining.address);
      console.log("LP Contract balance", Utils.fromWei(balance.toString()));
      console.log(" ");

      let user = await liquidityMining.users(owner.address, 1);
      console.log(
        "User stake data:\n\nstaked amount:",
        Utils.fromWei(user.stakedByUser.toString()),
        "\ntypeLock:",
        user.typeLock,
        "\nlastClaim:",
        Utils.toDate(user.lastClaim),
        "\nlastDeposit:",
        Utils.toDate(user.lastStake)
      );
    });
    it("move time forward 1 day", async () => {
      await time.increase(time.duration.days(1));
    });
    it("check getReward", async () => {
      let user = await liquidityMining.users(owner.address, 1);
      console.log(
        "User stake data:\n\nstaked amount:",
        Utils.fromWei(user.stakedByUser.toString()),
        "\ntypeLock:",
        user.typeLock,
        "\nlastClaim:",
        Utils.toDate(user.lastClaim),
        "\nlastDeposit:",
        Utils.toDate(user.lastStake)
      );
      let reward = await liquidityMining.rewardsToClaim(owner.address, 1);
      console.log(
        "reward earned after 1 day",
        Utils.fromWei(reward.toString())
      );
    });
    it("should claim reward", async () => {
      await liquidityMining.claimRewards(1);
      let user = await liquidityMining.users(owner.address, 1);
      console.log(
        "User stake data:\n\nstaked amount:",
        Utils.fromWei(user.stakedByUser.toString()),
        "\ntypeLock:",
        user.typeLock,
        "\nlastClaim:",
        Utils.toDate(user.lastClaim),
        "\nlastDeposit:",
        Utils.toDate(user.lastStake),
        "\nlastClaim:",
        user.lastClaim
      );
    });
    it("move time forward 3 month ( 1 month is 30.4166666667 days)", async () => {
      await time.increase(time.duration.days(93));
    });
    it("should unstakeAll ", async () => {
      let LPUserBalanceBefore = await LPContract.balanceOf(owner.address);
      let OVRUserBalanceBefore = await OVRContract.balanceOf(owner.address);

      await liquidityMining.unstakeAll(1);
      let user = await liquidityMining.users(owner.address, 1);
      console.log(
        "User stake data:\n\nstaked amount:",
        Utils.fromWei(user.stakedByUser.toString()),
        "\ntypeLock:",
        user.typeLock,
        "\nlastClaim:",
        Utils.toDate(user.lastClaim),
        "\nlastDeposit:",
        Utils.toDate(user.lastStake),
        "\nlastClaim:",
        user.lastClaim
      );

      let LPUserBalanceAfter = await LPContract.balanceOf(owner.address);
      let OVRUserBalanceAfter = await OVRContract.balanceOf(owner.address);
      console.log(
        "LPUserBalanceBefore",
        Utils.fromWei((LPUserBalanceAfter - LPUserBalanceBefore).toString())
      );
      console.log(
        "EARNED OVR",
        Utils.fromWei((OVRUserBalanceAfter - OVRUserBalanceBefore).toString())
      );
    });
    it("should stake with index 2", async () => {
      const amountDeposit = LPContract.balanceOf(owner.address);
      await liquidityMining.stake(amountDeposit, 2);
    });
    it("move time forward 6 months ", async () => {
      await time.increase(time.duration.days(186));
    });
    it("should unstakeAll ", async () => {
      let LPUserBalanceBefore = await LPContract.balanceOf(owner.address);
      let OVRUserBalanceBefore = await OVRContract.balanceOf(owner.address);

      await liquidityMining.unstakeAll(2);
      let user = await liquidityMining.users(owner.address, 2);
      console.log(
        "User stake data:\n\nstaked amount:",
        Utils.fromWei(user.stakedByUser.toString()),
        "\ntypeLock:",
        user.typeLock,
        "\nlastClaim:",
        Utils.toDate(user.lastClaim),
        "\nlastDeposit:",
        Utils.toDate(user.lastStake),
        "\nlastClaim:",
        user.lastClaim
      );

      let LPUserBalanceAfter = await LPContract.balanceOf(owner.address);
      let OVRUserBalanceAfter = await OVRContract.balanceOf(owner.address);
      console.log(
        "LPUserBalanceBefore",
        Utils.fromWei((LPUserBalanceAfter - LPUserBalanceBefore).toString())
      );
      console.log(
        "EARNED OVR",
        Utils.fromWei((OVRUserBalanceAfter - OVRUserBalanceBefore).toString())
      );
    });
    it("should stake with index 3", async () => {
      const amountDeposit = LPContract.balanceOf(owner.address);
      await liquidityMining.stake(amountDeposit, 3);
    });
    it("move time forward 9 months", async () => {
      await time.increase(time.duration.days(279));
    });
    it("should unstakeAll ", async () => {
      let LPUserBalanceBefore = await LPContract.balanceOf(owner.address);
      let OVRUserBalanceBefore = await OVRContract.balanceOf(owner.address);

      await liquidityMining.unstakeAll(3);
      let user = await liquidityMining.users(owner.address, 3);
      console.log(
        "User stake data:\n\nstaked amount:",
        Utils.fromWei(user.stakedByUser.toString()),
        "\ntypeLock:",
        user.typeLock,
        "\nlastClaim:",
        Utils.toDate(user.lastClaim),
        "\nlastDeposit:",
        Utils.toDate(user.lastStake),
        "\nlastClaim:",
        user.lastClaim
      );

      let LPUserBalanceAfter = await LPContract.balanceOf(owner.address);
      let OVRUserBalanceAfter = await OVRContract.balanceOf(owner.address);
      console.log(
        "LPUserBalanceBefore",
        Utils.fromWei((LPUserBalanceAfter - LPUserBalanceBefore).toString())
      );
      console.log(
        "EARNED OVR",
        Utils.fromWei((OVRUserBalanceAfter - OVRUserBalanceBefore).toString())
      );
    });
    it("should stake with index 4", async () => {
      const amountDeposit = LPContract.balanceOf(owner.address);
      await liquidityMining.stake(amountDeposit, 4);
    });
    it("move time forward 365 days", async () => {
      await time.increase(time.duration.days(365));
    });
    it("should show lockInfo with index 4", async () => {
      const lockInfo = await liquidityMining.lockInfo(4);
      console.log(lockInfo);
    });
    it("should unstakeAll ", async () => {
      let LPUserBalanceBefore = await LPContract.balanceOf(owner.address);
      let OVRUserBalanceBefore = await OVRContract.balanceOf(owner.address);

      await liquidityMining.unstakeAll(4);
      let user = await liquidityMining.users(owner.address, 4);
      console.log(
        "User stake data:\n\nstaked amount:",
        Utils.fromWei(user.stakedByUser.toString()),
        "\ntypeLock:",
        user.typeLock,
        "\nlastClaim:",
        Utils.toDate(user.lastClaim),
        "\nlastDeposit:",
        Utils.toDate(user.lastStake),
        "\nlastClaim:",
        user.lastClaim
      );

      let LPUserBalanceAfter = await LPContract.balanceOf(owner.address);
      let OVRUserBalanceAfter = await OVRContract.balanceOf(owner.address);
      console.log(
        "LPUserBalanceBefore",
        Utils.fromWei((LPUserBalanceAfter - LPUserBalanceBefore).toString())
      );
      console.log(
        "EARNED OVR",
        Utils.fromWei((OVRUserBalanceAfter - OVRUserBalanceBefore).toString())
      );
    });
    it("should show lockInfo with index 4", async () => {
      const lockInfo = await liquidityMining.lockInfo(4);
      console.log(lockInfo);
    });
  });
});
