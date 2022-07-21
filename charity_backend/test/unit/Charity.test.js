const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Charity", function () {
      let charity;
      let mockV3Aggregator;
      let deployer;
      const sendValue = ethers.utils.parseEther("2");
      const getValue = ethers.utils.parseEther("0.1");
      beforeEach(async () => {
        // deployer = accounts[0]
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        charity = await ethers.getContract("Charity", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", function () {
        it("sets the aggregator addresses correctly", async () => {
          const response = await charity.getPriceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      describe("Register", function () {
        it("fails if called by anyone other than owner", async () => {
          const accounts = await ethers.getSigners();
          const connectedcontract = await charity.connect(accounts[1]);
          await expect(
            connectedcontract.register(accounts[1].address)
          ).to.be.revertedWith("Only owner can register peoples");
        });
        it("updates needy Registered people", async () => {
          const accounts = await ethers.getSigners();
          const transactionResponse = await charity.register(
            accounts[1].address
          );
          let a = await charity.s_needyRegisterdpeople(accounts[1].address);
          assert.equal(a, true);
          a = await charity.s_peoples(0);
          assert.equal(a, accounts[1].address);
        });
      });

      describe("MoneyRequests", function () {
        it("fails if called by any unregistered peopele", async () => {
          const accounts = await ethers.getSigners();
          const connectedcontract = await charity.connect(accounts[1]);
          await expect(
            connectedcontract.MoneyRequest(getValue)
          ).to.be.revertedWith("Only Registered people can ask for money");
        });

        it("updates Money Requests if funds not available", async () => {
          const accounts = await ethers.getSigners();
          const transactionResponse = await charity.register(
            accounts[1].address
          );
          const connectedcontract = await charity.connect(accounts[1]);
          await connectedcontract.MoneyRequest(getValue);
          const totalmoney = await charity.s_moneyRequests(accounts[1].address);
          assert.equal(totalmoney.toString(), getValue.toString());
        });

        it("Sends ethers to needy if funds available", async () => {
          const accounts = await ethers.getSigners();
          await charity.register(accounts[1].address);
          await charity.Donate({ value: sendValue });
          const connectedcontract = await charity.connect(accounts[1]);

          const startingCharityBalance = await charity.provider.getBalance(
            charity.address
          );
          const startingneediesBalance =
            await connectedcontract.provider.getBalance(accounts[1].address);

          const transactionResponse = await connectedcontract.MoneyRequest(
            getValue
          );
          const transactionReceipt = await transactionResponse.wait();
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingCharityBalance = await charity.provider.getBalance(
            charity.address
          );
          const endingneediesBalance =
            await connectedcontract.provider.getBalance(accounts[1].address);

          const zeromoney = await charity.s_moneyRequests(accounts[1].address);
          assert.equal(zeromoney.toString(), "0");
          assert.equal(
            startingCharityBalance.add(startingneediesBalance).toString(),
            endingneediesBalance
              .add(endingCharityBalance)
              .add(gasCost)
              .toString()
          );
        });
      });

      describe("Donate", function () {
        it("Fails if you don't send enough ETH", async () => {
          await expect(charity.Donate()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });
        it("Updates the total amount Donated", async () => {
          await charity.Donate({ value: sendValue });
          const response = await charity.provider.getBalance(charity.address);
          assert.equal(response.toString(), sendValue.toString());
        });
      });

      describe("Distribute Donations", async () => {
        it("distributes donation to all pending people if enough funds available", async () => {
          const accounts = await ethers.getSigners();
          await charity.register(accounts[1].address);
          await charity.register(accounts[2].address);
          let connectedcontract = await charity.connect(accounts[1]);
          await connectedcontract.MoneyRequest(getValue);
          const ac1value = await connectedcontract.provider.getBalance(
            accounts[1].address
          );
          connectedcontract = await charity.connect(accounts[2]);
          await connectedcontract.MoneyRequest(getValue);
          const ac2value = await connectedcontract.provider.getBalance(
            accounts[2].address
          );

          await charity.Donate({ value: sendValue });
          const charityaccvalue = await charity.provider.getBalance(
            charity.address
          );
          await charity.distributeDonation();
          const ac1finalvalue = await connectedcontract.provider.getBalance(
            accounts[1].address
          );
          const ac2finalvalue = await connectedcontract.provider.getBalance(
            accounts[2].address
          );
          const charityaccfinalvalue = await charity.provider.getBalance(
            charity.address
          );
          assert.equal(
            ac1value.add(getValue).toString(),
            ac1finalvalue.toString()
          );
          assert.equal(
            ac2value.add(getValue).toString(),
            ac2finalvalue.toString()
          );
          assert.equal(
            charityaccvalue.toString(),
            charityaccfinalvalue.add(getValue).add(getValue).toString()
          );
        });
        it("distributes donation to few pending people if available fund are not enough for all", async () => {
          const accounts = await ethers.getSigners();
          await charity.register(accounts[1].address);
          await charity.register(accounts[2].address);
          let connectedcontract = await charity.connect(accounts[1]);
          await connectedcontract.MoneyRequest(getValue);
          const ac1value = await connectedcontract.provider.getBalance(
            accounts[1].address
          );
          connectedcontract = await charity.connect(accounts[2]);
          await connectedcontract.MoneyRequest(getValue);
          const ac2value = await connectedcontract.provider.getBalance(
            accounts[2].address
          );

          await charity.Donate({ value: ethers.utils.parseEther("1.1") });
          const charityaccvalue = await charity.provider.getBalance(
            charity.address
          );
          await charity.distributeDonation();
          connectedcontract = await charity.connect(accounts[1]);
          const ac1finalvalue = await connectedcontract.provider.getBalance(
            accounts[1].address
          );
          connectedcontract = await charity.connect(accounts[2]);
          const ac2finalvalue = await connectedcontract.provider.getBalance(
            accounts[2].address
          );
          const charityaccfinalvalue = await charity.provider.getBalance(
            charity.address
          );
          assert.equal(
            ac1value.add(getValue).toString(),
            ac1finalvalue.toString()
          );
          assert.equal(ac2value.toString(), ac2finalvalue.toString());
          assert.equal(
            charityaccvalue.toString(),
            charityaccfinalvalue.add(getValue).toString()
          );
        });
      });
    });
