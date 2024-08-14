let web3;
let ponziToken;
let jackpot;
let distribution;
let account;

const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3.eth.getAccounts();
        account = accounts[0];

        const connectButton = document.getElementById('connectButton');
        connectButton.style.display = 'none';
        const disconnectButton = document.getElementById('disconnectButton');
        disconnectButton.style.display = 'block';
        disconnectButton.setAttribute('data-wallet', account);
        disconnectButton.classList.add('red');

        loadContractData();
    } else {
        alert('Please install MetaMask to use this DApp!');
    }
};

const disconnectWallet = () => {
    account = null;
    document.getElementById('connectButton').style.display = 'block';
    document.getElementById('disconnectButton').style.display = 'none';
};

const loadContractData = async () => {
    const networkId = await web3.eth.net.getId();

    const ponziTokenAddress = '0xdDA42716c028293244ec74D9e78bb7E9c989A3D7'; // Replace with your contract address
    const jackpotAddress = '0x94cc7c790adcf532aa8b9f816575dc3e964edb71'; // Replace with your contract address
    const distributionAddress = '0x8c81C7C698b0f73574600030C3B5F79264a5489A'; // Replace with your contract address

    ponziToken = new web3.eth.Contract(PonziTokenABI, ponziTokenAddress);
    jackpot = new web3.eth.Contract(JackpotABI, jackpotAddress);
    distribution = new web3.eth.Contract(DistributionABI, distributionAddress);

    const mintPrice = await ponziToken.methods.mintPrice().call();
    document.getElementById('mintPrice').innerText = web3.utils.fromWei(mintPrice, 'ether') + ' OVER';

    const totalMinted = await ponziToken.methods.totalSupply().call();
    document.getElementById('totalMinted').innerText = totalMinted;

    const remainingTokens = 100000 - totalMinted;
    document.getElementById('remainingTokens').innerText = remainingTokens;

    const jackpotAmount = await web3.eth.getBalance(jackpotAddress);
    document.getElementById('jackpotAmount').innerText = web3.utils.fromWei(jackpotAmount, 'ether') + ' OVER';

    const userBalance = await ponziToken.methods.balanceOf(account).call();
    const totalRewards = (userBalance / totalMinted) * await web3.eth.getBalance(distributionAddress);
    document.getElementById('totalRewards').innerText = web3.utils.fromWei(totalRewards.toString(), 'ether') + ' OVER';

    const unclaimedRewards = await distribution.methods.getUnclaimedRewards(account).call();
    document.getElementById('unclaimedRewards').innerText = web3.utils.fromWei(unclaimedRewards.toString(), 'ether') + ' OVER';

    // Set oPo Contract Information
    document.getElementById('contractAddress').innerText = ponziTokenAddress;

    // Get total holders
    const totalHolders = await ponziToken.methods.totalSupply().call(); // Assuming totalSupply equals total holders
    document.getElementById('totalHolders').innerText = totalHolders;

    // Calculate and display cost on hover
    setupMintButtonHover('mintPrice', mintPrice, 1);
    setupMintButtonHover('mintPrice', mintPrice, 10);
    setupMintButtonHover('mintPrice', mintPrice, 100);

    // Listening for JackpotWon events
    jackpot.events.JackpotWon({
        fromBlock: 'latest'
    })
    .on('data', (event) => {
        const winner = event.returnValues;
        addWinnerToTable(event.blockNumber, winner.user, winner.amount);
    })
    .on('error', console.error);
};

const setupMintButtonHover = (elementId, mintPrice, quantity) => {
    const mintButton = document.querySelector(`.mint-button[onclick="mintToken(${quantity})"]`);
    mintButton.setAttribute('data-cost', `Total Cost: ${calculateTotalCost(mintPrice, quantity)} OVER`);
};

const calculateTotalCost = (mintPrice, quantity) => {
    let totalCost = 0;
    let currentPrice = parseFloat(web3.utils.fromWei(mintPrice, 'ether'));
    const priceIncreaseRate = 0.0002; // 0.02%

    for (let i = 0; i < quantity; i++) {
        totalCost += currentPrice;
        currentPrice += currentPrice * priceIncreaseRate;
    }

    return totalCost.toFixed(7); // Return with 7 decimal places
};

const toggleWinners = () => {
    const winnersTableContainer = document.getElementById('winnersTableContainer');
    if (winnersTableContainer.style.display === 'none') {
        winnersTableContainer.style.display = 'block';
    } else {
        winnersTableContainer.style.display = 'none';
    }
};

const addWinnerToTable = (blockNumber, user, amount) => {
    const jackpotWinnersTable = document.querySelector('#jackpotWinners tbody');
    const row = jackpotWinnersTable.insertRow();
    row.insertCell(0).innerText = blockNumber;
    row.insertCell(1).innerText = user;
    row.insertCell(2).innerText = web3.utils.fromWei(amount, 'ether') + ' OVER';
};

const mintToken = async (quantity) => {
    const mintPrice = await ponziToken.methods.mintPrice().call();
    const totalCost = calculateTotalCost(mintPrice, quantity);
    await ponziToken.methods.mintToken(quantity).send({ from: account, value: web3.utils.toWei(totalCost, 'ether') });
    loadContractData();
};

const claimRewards = async () => {
    await distribution.methods.claimRewards().send({ from: account });
    loadContractData();
};

window.addEventListener('load', () => {
    connectWallet();
});
