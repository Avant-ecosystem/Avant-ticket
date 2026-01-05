# VNFT Manager

VNFT-Manager template that manages the vnft contract.
It controls the minting, burning, and transfer of nfts on VNFT contract.

## Instructions to use both contracts:

1. Compile both contracts.
2. Upload the extended-vnft contract to the IDEA, you have to put the necesary data for your nfts.
3. Upload the vnft_manager contract, you can put an initial value for the contract (or you can put that info in each call to the contract): 
    - vnft_contract_id: Some or None, it is the contract if of the vnft contract.
4. In the vnft contract you need to grant admin, burn and minter role to the vft_manager contract.
5. To transfer a token, the user needs to approve the contract before it can transfer it to a new user.
6. With that, you can handle the vnft contract!


## Step 1: Open Contract on Gitpod

<p align="center">
  <a href="https://gitpod.io/#https://github.com/Vara-Lab/VNFT-Manager-Template.git" target="_blank">
    <img src="https://gitpod.io/button/open-in-gitpod.svg" width="240" alt="Gitpod">
  </a>
</p>

## Step 2: Compile and Deploy the Smart Contract

### Rust: You need to have rust 1.83 or newer to be able to compile your contract:

```bash
rustup install 1.83
rustup default 1.83
rustup target add wasm32-unknown-unknown
```

- In case that you dont have the "wasm optimezer", you need to install the wasm-opt (to optimize WebAssembly files) with:

```bash
sudo apt install binaryen
```

- GITPOT STEP: If you were to compile the contract on gitpot, you would need to add the "rust-src" component, with:

```bash
rustup component add rust-src --toolchain 1.83-x86_64-unknown-linux-gnu
```

### Compile the smart contract by running the following command:

```bash
cargo build --release
```

Once the compilation is complete, locate the `*.opt.wasm` file in the `target/wasm32-unknown-unknown/release` directory.


## Step 3: Interact with Your Contract on Vara Network

1. To interact with the Gear IDEA and deploy your contract, you will need to download a wallet extension such as [Polkadot-JS](https://polkadot.js.org/extension/), [Talisman](https://talisman.xyz/), or [Subwallet](https://subwallet.app/) to interact with Substrate-based chains.

<div align="center">
  <img src="https://polkadot.js.org/extension/extension-overview.png" alt="Polkadot-JS Extension">
</div>


## Step 4: Interact with Your Contract on Vara Network

1. Access [Gear IDE](https://idea.gear-tech.io/programs?node=wss%3A%2F%2Frpc.vara.network) using your web browser.
2. Connect your Substrate wallet to Gear IDE.
3. Upload the `*.opt.wasm` and `metadata.txt` files by clicking the "Upload Program" button.

**Vara Standards**: [Standards](https://github.com/gear-foundation/standards.git)  


## Try ut on gitpod!

<p align="center">
  <a href="https://gitpod.io/#https://github.com/Vara-Lab/VNFT-Manager-Template.git" target="_blank">
    <img src="https://gitpod.io/button/open-in-gitpod.svg" width="240" alt="Gitpod">
  </a>
</p>
