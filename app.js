document.addEventListener('DOMContentLoaded', async () => {
    const web3 = new Web3(window.ethereum);
    const overPonziAbi = await fetch('OverPonzi.json').then(response => response.json());
    const distributionAbi = await fetch('Distribution.json').then(response => response.json());

    const overPonziAddress = '0x9a406Dee8b16080A5D3C2772FCC7a9FC3f20fB38';
    const distributionAddress = '0xb764D4992df9E36F697c4538cE07F3c5024DcC46';

    const overPonzi = new web3.eth.Contract(overPonziAbi, overPonziAddress);
    const distribution = new web3.eth.Contract(distributionAbi, distributionAddress);

    let accounts = [];

    const connectWalletButton = document.getElementById('connectWallet');
    const mintPriceElement = document.getElementById('mintPrice');
    const totalMintedElement = document.getElementById('totalMinted');
    const remainingTokensElement = document.getElementById('remainingTokens');
    const totalRewardsElement = document.getElementById('totalRewards');
    const unclaimedRewardsElement = document.getElementById('unclaimedRewards');
    const totalHoldersElement = document.getElementById('totalHolders');

    connectWalletButton.addEventListener('click', async () => {
        if (window.ethereum) {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            connectWalletButton.textContent = 'Connected';
            connectWalletButton.classList.add('connected');
        } else {
            alert('Please install MetaMask!');
        }
    });

    async function loadContractData() {
        const mintPrice = await overPonzi.methods.mintPrice().call();
        const totalMinted = await overPonzi.methods.totalSupply().call();
        const maxSupply = await overPonzi.methods.MAX_SUPPLY().call();
        const totalHolders = await distribution.methods.holders.length().call();

        mintPriceElement.textContent = `${web3.utils.fromWei(mintPrice, 'ether')} OVER`;
        totalMintedElement.textContent = totalMinted;
        remainingTokensElement.textContent = maxSupply - totalMinted;
        totalHoldersElement.textContent = totalHolders;

        // Additional data loading (rewards, jackpot, etc.) can be done similarly
    }

    async function mintTokens(quantity) {
        const cost = await overPonzi.methods.calculateTotalCost(quantity).call();
        await overPonzi.methods.mintToken(quantity).send({ from: accounts[0], value: cost });
        loadContractData(); // Reload data after minting
    }

    document.getElementById('mint1').addEventListener('click', () => mintTokens(1));
    document.getElementById('mint10').addEventListener('click', () => mintTokens(10));
    document.getElementById('mint100').addEventListener('click', () => mintTokens(100));

    document.getElementById('claimRewards').addEventListener('click', async () => {
        await distribution.methods.claimRewards().send({ from: accounts[0] });
        loadContractData(); // Reload data after claiming rewards
    });

    loadContractData(); // Initial load
});
