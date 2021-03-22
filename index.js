import "@babel/polyfill";
import "./index.css";
import React, { Component } from "react";
import ReactDOM from "react-dom";
import Eth from "@ledgerhq/hw-app-eth";
import TransportUSB from "@ledgerhq/hw-transport-webusb";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import { MinaLedgerJS, Networks, TxType } from "./src/";

const getAppVersion = async (instance) => {
  const version = await instance.getAppVersion();
  console.log(version);
  return version;
};
const getAddress = async (instance, index) => {
  const address = await instance.getAddress(index);
  console.log(address);
  return address;
};
const getNameVersion = async (instance) => {
  const name = await instance.getAppName();
  console.log(name);
  return name;
};
const getSignature = async (instance) => {
  const signature = await instance.signTransaction({
    "senderAccount": 0,
    "senderAddress": "B62qoBEWahYw3CzeFLBkekmT8B7Z1YsfhNcP32cantDgApQ97RNUMhT",
    "receiverAddress": "B62qkEB9FPhBs9mYdPJPVkUevrJuYr22MwANNvavy6HWZEDqL8WKR3F",
    "fee": +"98146290",
    "amount": +"1000000000",
    "memo": "hub <3 ledger!",
    "nonce": 2,
    "txType": 0,
    "networkId": 0,
    "validUntil": "4294967295"
   });
  return signature;
};
const getDelegation = async (instance, index, publicKey, validator, fee, nonce, memo) => {
  const details = {
    txType: TxType.DELEGATION,
    senderAccount: index,
    senderAddress: publicKey,
    receiverAddress: validator,
    amount: 0,
    fee: fee,
    nonce: nonce,
    memo: memo,
    networkId: Networks.MAINNET,
  };
  console.log(details);
  const signature = await instance.signTransaction(details);
  console.log(signature);
  return signature;
};

/*
(async () => {

  console.log(` 
  
  >> mina-ledger-js usage example on Node:
  
  `)

  const transport = await TransportNodeHid.create();
  const instance = new MinaLedgerJS(transport);
  await getNameVersion(instance);
  await getAppVersion(instance);
  await getAddress(instance);
  await getDelegation(instance);
  await getSignature(instance);
})();
*/

class App extends Component {
  state = {
    address: null,
    addressIndex: 0,
    error: null,
    message: null,
    tx: null,
    fee: null,
    nonce: null,
    validator: 'B62qrHzjcZbYSsrcXVgGko7go1DzSEBfdQGPon5X4LEGExtNJZA4ECj',
    memo: null,
    balance: null,
    network: null,
  };
  onGetLedgerMinaAddress = async () => {
    try {
      this.setState({ error: null });
      let transport;
      if (window.USB) {
        transport = await TransportUSB.create();
      } else if (window.u2f) {
        transport = await TransportU2F.create();
      } else {
        this.setState({ error: new Error('Browser not supported. Use Chrome, Firefox, Brave, Opera or Edge.') });
        return;
      }
      const instance = new MinaLedgerJS(transport);
      const { publicKey } = await getAddress(instance, this.state.addressIndex);
      this.setState({ address: publicKey });
    } catch (error) {
      this.setState({ error });
    }
  };

  onGetNonceAndFee = async () => {
    try {
      this.setState({ error: null });
      const response = await fetch(`https://api.minaexplorer.com/accounts/${this.state.address}`);
      const account = await response.json();

      const blockResponse = await fetch('https://api.minaexplorer.com/blocks?limit=1');
      const block = await blockResponse.json();

      this.setState({ nonce: account.account.nonce, fee: Math.min(Math.max(...block.blocks[0].transactions.userCommands.map(x => x.fee)), 1000000000), balance: account.account.balance.total });
    } catch (error) {
      this.setState({ error });
    }
  };

  onDelegate = async () => {
    try {
      this.setState({ error: null });
      let transport;
      if (window.USB) {
        transport = await TransportUSB.create();
      } else if (window.u2f) {
        transport = await TransportU2F.create();
      } else {
        this.setState({ error: new Error('Browser not supported. Use Chrome, Firefox, Brave, Opera or Edge.') });
        return;
      }
      const instance = new MinaLedgerJS(transport);
      const signature = await getDelegation(instance, this.state.addressIndex, this.state.address, this.state.validator, parseInt(this.state.fee), parseInt(this.state.nonce), this.state.memo);
      this.setState({ tx: signature.signature });
    } catch (error) {
      this.setState({ error });
    }
  };

  onBroadcast = async () => {
    try {
      const settings = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature: this.state.signature,
          stake_delegation: {
            delegator: this.state.address,
            new_delegate: this.state.validator,
            nonce: this.state.nonce.toString(),
            fee: this.state.fee.toString(),
            memo: this.state.memo,
            valid_until: 4294967295
          },
        }),
      };
      console.log(settings);
      const fetchResponse = await fetch(`https://api.minaexplorer.com/broadcast/transaction`, settings);
      const data = await fetchResponse.json();
      this.setState({ message: data.message });
    } catch (error) {
      this.setState({ error });
    }
  };

  onSetNetwork = async () => {
    try {
      this.setState({ error: null });
      let network;
      if (this.refs.radioDevnet.checked) {
        network = Networks.DEVNET;
      } else if (this.refs.radioMainnet.checked) {
        network = Networks.MAINNET;
      } else {
        throw new Error('Unknown network');
      }
      console.log(network);
      this.setState({ tx: signature.signature, network });
    } catch (error) {
      this.setState({ error });
    }
  };



  handleChange(type, value) {
    if (type == 'tx') {
      this.setState({
        tx: value
      });
    } else if (type == 'addressIndex') {
      this.refs.address.value = '';
      this.refs.fee.value = '';
      this.refs.nonce.value = '';
      this.refs.tx.value = '';
      this.setState({
        addressIndex: value,
        address: null,
        fee: null,
        nonce: null,
        balance: null,
        tx: null,
      });
    } else if (type == 'fee') {
      this.refs.tx.value = '';
      this.setState({
        fee: value,
        tx: null,
      });
    } else if (type == 'nonce') {
      this.refs.tx.value = '';
      this.setState({
        nonce: value,
        tx: null,
      });
    } else if (type == 'address') {
      this.refs.fee.value = '';
      this.refs.nonce.value = '';
      this.refs.tx.value = '';
      this.setState({
        address: value,
        fee: null,
        nonce: null,
        balance: null,
        tx: null,
      });
    } else if (type == 'validator') {
      this.refs.tx.value = '';
      this.setState({
        validator: value,
        tx: null,
      });
    } else if (type == 'memo') {
      this.refs.tx.value = '';
      this.setState({
        memo: value,
        tx: null,
      });
    }
  }

  render() {
    const { address, error, message, balance } = this.state;
    return (
      <div class="row">
        <h1>Mina Ledger Delegator Tool</h1>
        <div class="alert alert-danger" role="alert">
          This program has not been thoroughly tested nor audited. Use with care!
        </div>
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Step 1: Choose network</h5>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="flexRadioDefault" id="radioDevnet" ref="radioDevnet" onChange={e => this.onSetNetwork()}/>
              <label class="form-check-label" for="radioDevnet">
                DEVNET
              </label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="flexRadioDefault" id="radioMainnet" ref="radioMainnet" onChange={e => this.onSetNetwork()} />
              <label class="form-check-label" for="radioMainnet">
                MAINNET
              </label>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Step 2: Get your address</h5>
            <label for="addressIndexInput">Address Index</label>
            <input id="addressIndexInput" class="form-control" type="text" ref="addressIndex" value={this.state.addressIndex} onChange={(e) =>this.handleChange('addressIndex', e.target.value)} />
            <button class="btn btn-primary" onClick={this.onGetLedgerMinaAddress}>
              Get Ledger Mina Address
            </button>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Step 3: Get nonce and fee</h5>
            <p>
              This gets the nonce and fee from Mina Explorer. The fee is calculated as min(1, max(fee of txs in last block)).
            </p>
            <label for="addressInput">Address</label>
            <input id="addressInput" class="form-control" type="text" ref="address" value={this.state.address} onChange={(e) =>this.handleChange('address', e.target.value)} />
            <button class="btn btn-primary" onClick={this.onGetNonceAndFee}>
              Get nonce and fee from Mina Explorer
            </button>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Step 4: Generate delegation transaction</h5>
            {balance ? (
              <div class="alert alert-primary" role="alert">
                Balance: {balance.toString()}
              </div>) : null}
            <label for="feeInput">Fee (in nanomina)</label>
            <input id="feeInput" class="form-control" type="text" ref="fee" value={this.state.fee} onChange={(e) =>this.handleChange('fee', e.target.value)} />
            <label for="nonceInput">Nonce</label>
            <input id="nonceInput" class="form-control" type="text" ref="nonce" value={this.state.nonce} onChange={(e) =>this.handleChange('nonce', e.target.value)} />
            <label for="validatorInput">Validator Public Key (Default - ZKValidator)</label>
            <input id="validatorInput" class="form-control" type="text" ref="validator" value={this.state.validator} onChange={(e) =>this.handleChange('validator', e.target.value)} />
            <label for="memoInput">Memo (recommended - discord username)</label>
            <input id="memoInput" class="form-control" type="text" ref="memo" value={this.state.memo} onChange={(e) =>this.handleChange('memo', e.target.value)} />
            <button class="btn btn-primary" onClick={this.onDelegate}>
              Generate Delegation Transaction
            </button>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Step 5: Broadcast transaction</h5>
            <label for="txInput">Transaction</label>
            <input id="txInput" class="form-control" type="text" ref="tx" value={this.state.tx} onChange={(e) =>this.handleChange('tx', e.target.value)} />
            <button  class="btn btn-primary"onClick={this.onBroadcast}>
              Broadcast Raw Transaction
            </button>
          </div>
        </div>
        <p>
          {error ? (
            <div class="alert alert-danger" role="alert">
              {error.toString()}
            </div>
          ) : null}
        </p>
        <p>
          {message ? (
              <div class="alert alert-primary" role="alert">
                {message.toString()}
              </div>
           ) : null
          }
        </p>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
