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
        alert('Please install MetaMask to use this dApp!');
    }
};

const disconnectWallet = () => {
    account = null;
    document.getElementById('connectButton').style.display = 'block';
    document.getElementById('disconnectButton').style.display = 'none';
};

const loadContractData = async () => {
    const networkId = await web3.eth.net.getId();

    const ponziTokenAddress = 'YOUR_PONZI_TOKEN_CONTRACT_ADDRESS'; // Replace with your contract address
    const jackpotAddress = 'YOUR_JACKPOT_CONTRACT_ADDRESS'; // Replace with your contract address
    const distributionAddress = 'YOUR_DISTRIBUTION_CONTRACT_ADDRESS'; // Replace with your contract address

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

const addWinnerToTable = (blockNumber, user, amount) => {
    const jackpotWinnersTable = document.querySelector('#jackpotWinners tbody');
    const row = jackpotWinnersTable.insertRow();
    row.insertCell(0).innerText = blockNumber;
    row.insertCell(1).innerText = user;
    row.insertCell(2).innerText = web3.utils.fromWei(amount, 'ether') + ' OVER';
};

const mintToken = async (quantity) => {
    const mintPrice = await ponziToken.methods.mintPrice().call();
    const totalCost = mintPrice * quantity;
    await ponziToken.methods.mintToken(quantity).send({ from: account, value: totalCost });
    loadContractData();
};

const claimRewards = async () => {
    await distribution.methods.claimRewards().send({ from: account });
    loadContractData();
};

window.addEventListener('load', () => {
    connectWallet();
});
