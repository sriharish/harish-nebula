const StarNotary = artifacts.require('./StarNotary.sol');

let instance;
let accounts;

contract('StarNotary', async (_accounts) => {
    accounts = _accounts;
});

it('can create a star', async () => {
    instance = await StarNotary.deployed();
    let name = 'Harishix-0310';
    let tokenId = 1;
    await instance.createStar(name, tokenId, { from: accounts[0] });
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), name);
});

it('can put star up for sale', async () => {
    instance = await StarNotary.deployed();
    let name = 'Harishix-0310';
    let tokenId = 2;
    let price = web3.utils.toWei("0.01", "ether"); // wei
    await instance.createStar(name, tokenId, { from: accounts[0] });
    await instance.putStarUpForSale(tokenId, price, { from: accounts[0] });
    assert.equal(await instance.starsForSale.call(tokenId), price);
});

it('lets a user recieve funds after a sale', async () => {
    instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starName = "Harishix-0311"
    let starPrice = web3.utils.toWei("0.01", "ether");
    let balance = web3.utils.toWei("0.05", "ether");
    await instance.createStar(starName, starId, { from: user1 });
    await instance.putStarUpForSale(starId, starPrice, { from: user1 });
    let preTransactionBalance = await web3.eth.getBalance(user1); // user 1 balance (seller)
    await instance.buyStar(starId, { from: user2, value: balance });
    let postTransactionBalance = await web3.eth.getBalance(user1); // user 1 balance (seller)
    assert.equal(Number(preTransactionBalance), Number(postTransactionBalance) - Number(starPrice));
});

it('lets a user buy a star, if it is put up for sale', async() => {
    instance = await StarNotary.deployed();
    let user1 = accounts[2];
    let user2 = accounts[3];
    let starId = 4;
    let starName = "Harishix-0312";
    let starPrice = web3.utils.toWei("0.01", "ether");
    let balance = web3.utils.toWei("0.05", "ether");
    await instance.createStar(starName, starId, { from: user1 });
    await instance.putStarUpForSale(starId, starPrice, { from: user1 });
    await instance.buyStar(starId, { from: user2, value: balance });
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('decreases a user\'s balance after they buy a star', async() => {
    instance = await StarNotary.deployed();
    let user1 = accounts[3];
    let user2 = accounts[4];
    let starId = 5;
    let starName = "Harishix-0313"
    let starPrice = web3.utils.toWei("0.01", "ether");
    let balance = web3.utils.toWei("0.05", "ether");
    await instance.createStar(starName, starId, { from: user1 });
    await instance.putStarUpForSale(starId, starPrice, { from: user1 });
    let preTransactionBalance = await web3.eth.getBalance(user2); // user 2 balance (buyer)
    await instance.buyStar(starId, { from: user2, value: balance, gasPrice: 0 });
    let postTransactionBalance = await web3.eth.getBalance(user2); // user 2 balance (buyer)
    let finalBalance = Number(preTransactionBalance) - Number(postTransactionBalance);
    assert.equal(finalBalance, starPrice);
});

// project rubric tests

it('[the token] has the correct name and symbol', async() => {
    instance = await StarNotary.deployed();
    const _tokenName = "Harish Nebula";
    const _tokenSymbol = "HNT";
    assert.equal(await instance.name.call(), _tokenName);
    assert.equal(await instance.symbol.call(), _tokenSymbol);
});

it('can exchange stars', async() => {
    instance = await StarNotary.deployed();

    let user1 = accounts[4];
    let user2 = accounts[5];
    let starId1 = 6;
    let starName1 = "Harishix-0314"
    let starId2 = 7;
    let starName2 = "Harishix-0315";

    await instance.createStar(starName1, starId1, { from: user1 });
    await instance.createStar(starName2, starId2, { from: user2 });
    
    // test if stars are traded and belong to new correct owners
    await instance.exchangeStars(starId1, starId2, { from: user1 }); // first star is put up for trade, but waiting for user2
    await instance.exchangeStars(starId2, starId1, { from: user2 }); // exchange of stars happens here
    assert.equal(await instance.ownerOf.call(starId2), user1);
    assert.equal(await instance.ownerOf.call(starId1), user2);    
});

it('can safely transfer stars', async() => {
    instance = await StarNotary.deployed();

    let user1 = accounts[4];
    let user2 = accounts[5];
    let starId = 8;
    let starName = "Harishix-0316"

    await instance.createStar(starName, starId, { from: user1 });

    // test if stars are traded and belong to new correct owners
    await instance.transferStarTo(user2, starId, { from: user1 }); // first star is put up for trade, but waiting for user2
    assert.equal(await instance.ownerOf.call(starId), user2);
});