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
const getDelegation = async (instance) => {
  const signature = await instance.signTransaction({
    txType: TxType.DELEGATION,
    senderAccount: 0,
    senderAddress: "delegator",
    receiverAddress: "delegatee(perhaps carbonara? ;) )",
    amount: 0,
    fee: 1000000000,
    nonce: 0,
    memo: "delegate-to-carbonara",
    networkId: Networks.DEVNET,
  });
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
    error: null
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

  handleChange(type, value) {
    if (type == 'tx') {
      this.setState({
        tx: value
      });
    } else if (type == 'addressIndex') {
      this.setState({
        addressIndex: value
      });
    }
  }

  render() {
    const { address, error } = this.state;
    return (
      <div>
        <p>
          <input type="text" value={this.state.addressIndex} onChange={(e) =>this.handleChange('addressIndex', e.target.value)} />
          <button onClick={this.onGetLedgerMinaAddress}>
            Get Ledger Mina Address
          </button>
        </p>
        {/*
        <p>
          <input type="text" value={this.state.tx} onChange={(e) =>this.handleChange('tx', e.target.value)} />
          <button onClick={this.onLedgerMinaSendTx}>
            Send Raw Transaction
          </button>
        </p>
        */}
        <p>
          {error ? (
            <code className="error">{error.toString()}</code>
          ) : (
            <code className="address">{address}</code>
          )}
        </p>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
