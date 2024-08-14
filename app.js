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
        document.getElementById('account').innerText = account;
        document.getElementById('connectButton').style.display = 'none';
        document.getElementById('disconnectButton').style.display = 'block';

        loadContractData();
    } else {
        alert('Please install MetaMask to use this dApp!');
    }
};

const disconnectWallet = () => {
    account = null;
    document.getElementById('account').innerText = 'Connect your wallet';
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

    // Load the latest jackpot winners (this would require an event log listener or a server-side implementation)
    // Example:
    const latestWinners = []; // Replace with logic to fetch recent winners
    const jackpotWinnersTable = document.querySelector('#jackpotWinners tbody');
    latestWinners.forEach(winner => {
        const row = jackpotWinnersTable.insertRow();
        row.insertCell(0).innerText = winner.blockNumber;
        row.insertCell(1).innerText = winner.address;
        row.insertCell(2).innerText = web3.utils.fromWei(winner.amount, 'ether') + ' OVER';
    });
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
