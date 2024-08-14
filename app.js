document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.ethereum !== 'undefined') {
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
            try {
                accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                connectWalletButton.textContent = 'Connected';
                connectWalletButton.classList.add('connected');
            } catch (error) {
                console.error("User denied wallet connection", error);
                alert("Please connect your wallet to continue.");
            }
        });

        async function loadContractData() {
            try {
                const mintPrice = await overPonzi.methods.mintPrice().call();
                const totalMinted = await overPonzi.methods.totalSupply().call();
                const maxSupply = await overPonzi.methods.MAX_SUPPLY().call();
                const totalHolders = await distribution.methods.holders.length().call();

                mintPriceElement.textContent = `${web3.utils.fromWei(mintPrice, 'ether')} OVER`;
                totalMintedElement.textContent = totalMinted;
                remainingTokensElement.textContent = maxSupply - totalMinted;
                totalHoldersElement.textContent = totalHolders;
            } catch (error) {
                console.error("Failed to load contract data", error);
            }
        }

        async function mintTokens(quantity) {
            try {
                const cost = await overPonzi.methods.calculateTotalCost(quantity).call();
                await overPonzi.methods.mintToken(quantity).send({ from: accounts[0], value: cost });
                loadContractData(); // Reload data after minting
            } catch (error) {
                console.error("Failed to mint tokens", error);
                alert("Minting failed. Please try again.");
            }
        }

        document.getElementById('mint1').addEventListener('click', () => mintTokens(1));
        document.getElementById('mint10').addEventListener('click', () => mintTokens(10));
        document.getElementById('mint100').addEventListener('click', () => mintTokens(100));

        document.getElementById('claimRewards').addEventListener('click', async () => {
            try {
                await distribution.methods.claimRewards().send({ from: accounts[0] });
                loadContractData(); // Reload data after claiming rewards
            } catch (error) {
                console.error("Failed to claim rewards", error);
                alert("Claiming rewards failed. Please try again.");
            }
        });

        loadContractData(); // Initial load
    } else {
        alert("MetaMask is not installed. Please install MetaMask to use this DApp.");
    }
});
