import { ethers } from "hardhat";
import {AIFunctionsClient, FINDR, RestaurantInfo} from "../typechain-types";
import {BigNumber, Signer} from "ethers";
const { expect } = require("chai");

describe("RestaurantInfo", () => {
    let restaurantInfo: RestaurantInfo;
    let mockERC20: FINDR;
    let supply: BigNumber;
    let aiFunctionsClient: AIFunctionsClient;
    let oracleAddress: string;
    let owner: Signer;
    let addr1: Signer;
    let addr2: Signer;
    let addr3: Signer;

    beforeEach(async () => {
        oracleAddress = "0x0000000000000000000000000000000000000000";
        supply = ethers.utils.parseEther("1000000000");

        [owner, addr1, addr2, addr3] = await ethers.getSigners();


        const restaurantInfoFactory = await ethers.getContractFactory("RestaurantInfo");
        restaurantInfo = (await restaurantInfoFactory.deploy()) as RestaurantInfo;

        const mockERC20Factory = await ethers.getContractFactory("FINDR");
        mockERC20 = (await mockERC20Factory.deploy(supply, restaurantInfo.address)) as FINDR;

        const aiFunctionsClientFactory = await ethers.getContractFactory("AIFunctionsClient");
        aiFunctionsClient = (await aiFunctionsClientFactory.deploy(oracleAddress, restaurantInfo.address)) as AIFunctionsClient;

        await restaurantInfo.initialize(mockERC20.address, aiFunctionsClient.address);
    });

    describe("addRestaurant", () => {
        it("should add a restaurant", async () => {
            await restaurantInfo.addRestaurant(1, "Restaurant 1");
            const [restaurantId, stakedFINDRTokens] = await restaurantInfo.getRestaurantDetails(1);
            expect(restaurantId).to.equal(1);
        });

        it("should revert if restaurant already exists", async () => {
            await restaurantInfo.addRestaurant(1, "Restaurant 1");
            await expect(restaurantInfo.addRestaurant(1, "Restaurant 1")).to.be.revertedWith("Restaurant already exists");
        });
    });

    describe("stakeRestaurant", () => {
        it("should stake a restaurant", async () => {
            const tokensToStake = ethers.utils.parseEther("1000");
            await mockERC20.approve(restaurantInfo.address, tokensToStake);
            await restaurantInfo.stakeRestaurant(1, tokensToStake);
            const [restaurantId, stakedFINDRTokens] = await restaurantInfo.getRestaurantDetails(1);
            expect(restaurantId).to.equal(1);
            expect(stakedFINDRTokens).to.equal(tokensToStake);
        });

        it("should not stake more tokens than the allowance", async () => {
            const amount = 500;
            await mockERC20.approve(restaurantInfo.address, amount - 1);
            await expect(restaurantInfo.stakeRestaurant(1, amount)).to.be.revertedWith("Token allowance not sufficient");
        });
    });

    describe("unstakeRestaurant", () => {
        it("should unstake a restaurant", async () => {
            const tokensToStake = ethers.utils.parseEther("1000");
            const tokensToUnstake = ethers.utils.parseEther("500");
            await mockERC20.approve(restaurantInfo.address, tokensToStake);
            await restaurantInfo.stakeRestaurant(1, tokensToStake);
            await restaurantInfo.unstakeRestaurant(1, tokensToUnstake);
            const [restaurantId, stakedFINDRTokens] = await restaurantInfo.getRestaurantDetails(1);
            expect(restaurantId).to.equal(1);
            expect(stakedFINDRTokens).to.equal(tokensToStake.sub(tokensToUnstake));
        });
    });

    describe("claimReward", () => {
        // it("should claim reward correctly", async () => {
        //     const initialStake = 1000;
        //     const initialReward = 500;
        //
        //     await restaurantInfo.addRestaurant(1, "Details");
        //
        //     mockERC20.transfer(addr1.getAddress(), initialStake);
        //     await mockERC20.connect(addr1).approve(restaurantInfo.address, initialStake);
        //     mockERC20.transfer(addr2.getAddress(), initialStake);
        //     await mockERC20.connect(addr2).approve(restaurantInfo.address, initialStake);
        //     mockERC20.transfer(addr3.getAddress(), initialStake);
        //     await mockERC20.connect(addr3).approve(restaurantInfo.address, initialStake);
        //     await restaurantInfo.connect(addr1).stakeRestaurant(1, initialStake);
        //     await restaurantInfo.connect(addr2).stakeRestaurant(1, initialStake);
        //     await restaurantInfo.connect(addr3).stakeRestaurant(1, initialStake);
        //
        //
        //     const initialBalance = await mockERC20.balanceOf(await addr1.getAddress());
        //     mockERC20.transfer(restaurantInfo.address, initialReward);
        //     await restaurantInfo.connect(addr1).claimReward(1);
        //     const finalBalance = await mockERC20.balanceOf(await addr1.getAddress());
        //     expect(finalBalance.sub(initialBalance)).to.equal(initialReward);
        // });

        it("should not claim reward if no tokens staked", async () => {
            const initialReward = 500;

            await restaurantInfo.addRestaurant(1, "Details");

            await expect(restaurantInfo.connect(addr1).claimReward(1)).to.be.revertedWith("No tokens staked");
        });

        it("should not claim reward if restaurant does not exist", async () => {
            await expect(restaurantInfo.connect(addr1).claimReward(1)).to.be.revertedWith("Restaurant does not exist");
        });
    });


    // Additional tests for remaining functions
});
