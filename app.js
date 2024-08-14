window.addEventListener('load', async () => {
    if (typeof window.ethereum !== 'undefined') {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        document.getElementById('account').innerText = account;

        const networkId = await web3.eth.net.getId();
        const ponziTokenAddress = 'YOUR_CONTRACT_ADDRESS'; // Replace with your contract address
        const ponziTokenABI = []; // Replace with your ABI array

        const ponziToken = new web3.eth.Contract(ponziTokenABI, ponziTokenAddress);

        const mintPrice = await ponziToken.methods.mintPrice().call();
        document.getElementById('mintPrice').innerText = web3.utils.fromWei(mintPrice, 'ether');

        const totalSupply = await ponziToken.methods.totalSupply().call();
        document.getElementById('totalSupply').innerText = totalSupply;

        const userBalance = await ponziToken.methods.balanceOf(account).call();
        const rewards = (userBalance / totalSupply) * await web3.eth.getBalance(ponziTokenAddress);
        document.getElementById('rewards').innerText = web3.utils.fromWei(rewards.toString(), 'ether');

        document.getElementById('mintButton').addEventListener('click', async () => {
            await ponziToken.methods.mintToken().send({ from: account, value: mintPrice });
            const updatedTotalSupply = await ponziToken.methods.totalSupply().call();
            document.getElementById('totalSupply').innerText = updatedTotalSupply;

            const updatedMintPrice = await ponziToken.methods.mintPrice().call();
            document.getElementById('mintPrice').innerText = web3.utils.fromWei(updatedMintPrice, 'ether');
        });
    } else {
        alert('Please install MetaMask to use this dApp!');
    }
});
